"use server";

import { db } from "@/prisma/db";
import type {
  BookingLookupDTO,
  BookingLookupResult,
  CreateBookingInput,
  CreateBookingResult,
} from "@/types";

/** Generate a BV- code with 6 chars from unambiguous alphabet. */
function generateBookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/1/I/O
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return "BV-" + code;
}

/** Check if a booking code exists. */
async function codeExists(code: string): Promise<boolean> {
  const existing = await db.orm.public.Booking
    .select("id")
    .where((f) => f.code.eq(code))
    .limit(1)
    .all();
  return existing.length > 0;
}

/** Generate a unique code with up to 3 retries. */
async function generateUniqueCode(): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateBookingCode();
    const exists = await codeExists(code);
    if (!exists) return code;
  }
  return null;
}

/**
 * Create a new booking with all related records.
 * Errors surface — never swallowed.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  try {
    // Validate product exists and is active
    const products = await db.orm.public.Product
      .select("id", "slug", "leadTimeHours", "leadTimeDays", "lineId")
      .where((f) => f.slug.eq(input.productSlug))
      .where((f) => f.active.eq(true))
      .limit(1)
      .all();

    const product = products[0];
    if (!product) {
      return { ok: false, error: "Product not found or inactive" };
    }

    // Validate package if provided
    let packageRecord: { id: string; label: string; unitKind: string; adultUsdCents: number | null; childUsdCents: number | null; infantUsdCents: number | null; unitUsdCents: number | null } | null = null;
    if (input.packageId) {
      const packageId = input.packageId; // narrow to string
      const packages = await db.orm.public.ProductPackage
        .select("id", "label", "unitKind", "adultUsdCents", "childUsdCents", "infantUsdCents", "unitUsdCents")
        .where((f) => f.id.eq(packageId))
        .where((f) => f.productId.eq(product.id))
        .where((f) => f.active.eq(true))
        .limit(1)
        .all();
      packageRecord = packages[0] ?? null;
      if (!packageRecord) {
        return { ok: false, error: "Package not found or inactive" };
      }
    }

    // Validate lead time
    const serviceAt = new Date(input.serviceAt);
    const now = new Date();
    if (product.leadTimeDays > 0) {
      const minDate = new Date(now.getTime() + product.leadTimeDays * 24 * 60 * 60 * 1000);
      if (serviceAt < minDate) {
        return { ok: false, error: `Service requires at least ${product.leadTimeDays} day(s) lead time` };
      }
    } else if (product.leadTimeHours > 0) {
      const minDate = new Date(now.getTime() + product.leadTimeHours * 60 * 60 * 1000);
      if (serviceAt < minDate) {
        return { ok: false, error: `Service requires at least ${product.leadTimeHours} hour(s) lead time` };
      }
    }

    // Validate adult >= 1
    if (input.adult < 1) {
      return { ok: false, error: "At least 1 adult is required" };
    }

    // Resolve add-ons
    const addOnRecords: { id: string; slug: string; label: string; unitUsdCents: number | null }[] = [];
    if (input.addOns.length > 0) {
      const addOnSlugs = input.addOns.map((a) => a.slug);
      // Verify add-ons are linked to this product
      const joins = await db.orm.public.ProductAddOn
        .select("addOnId")
        .where((f) => f.productId.eq(product.id))
        .all();
      const linkedAddOnIds = joins.map((j) => j.addOnId);

      const addOnProducts = await db.orm.public.Product
        .select("id", "slug", "title", "fromPriceUsdCents")
        .where((f) => f.slug.in(addOnSlugs))
        .where((f) => f.active.eq(true))
        .all();

      for (const addOnInput of input.addOns) {
        const addOnProduct = addOnProducts.find((p) => p.slug === addOnInput.slug);
        if (!addOnProduct) {
          return { ok: false, error: `Add-on not found: ${addOnInput.slug}` };
        }
        if (!linkedAddOnIds.includes(addOnProduct.id)) {
          return { ok: false, error: `Add-on not available for this product: ${addOnInput.slug}` };
        }
        if (addOnInput.qty < 1 || addOnInput.qty > 10) {
          return { ok: false, error: `Add-on quantity must be between 1 and 10: ${addOnInput.slug}` };
        }
        addOnRecords.push({
          id: addOnProduct.id,
          slug: addOnProduct.slug,
          label: addOnProduct.title,
          unitUsdCents: addOnProduct.fromPriceUsdCents,
        });
      }
    }

    // Recompute totals server-side from DB cents
    let subtotalUsdCents = 0;
    let addOnsUsdCents = 0;

    // Calculate package subtotal
    if (packageRecord) {
      if (packageRecord.unitKind === "per_pax") {
        subtotalUsdCents += (packageRecord.adultUsdCents ?? 0) * input.adult;
        subtotalUsdCents += (packageRecord.childUsdCents ?? 0) * input.child;
        subtotalUsdCents += (packageRecord.infantUsdCents ?? 0) * input.infant;
      } else {
        subtotalUsdCents += (packageRecord.unitUsdCents ?? 0);
      }
    }

    // Calculate add-ons
    for (const addOn of input.addOns) {
      const addOnRec = addOnRecords.find((r) => r.slug === addOn.slug);
      if (addOnRec) {
        addOnsUsdCents += (addOnRec.unitUsdCents ?? 0) * addOn.qty;
      }
    }

    const totalUsdCents = subtotalUsdCents + addOnsUsdCents;

    // Generate unique code
    const code = await generateUniqueCode();
    if (!code) {
      return { ok: false, error: "Could not generate unique booking code. Please try again." };
    }

    // Sequential inserts with compensating deletes on failure
    const bookingId = crypto.randomUUID();

    try {
      // 1. Booking
      await db.orm.public.Booking.create({
        id: bookingId,
        code,
        status: "awaiting_payment",
        serviceAt,
        adultCount: input.adult,
        childCount: input.child,
        infantCount: input.infant,
        subtotalUsdCents,
        addOnsUsdCents,
        totalUsdCents,
        currencyCode: input.currencyCode,
        fxRate: input.fxRate,
      });

      // 2. BookingItem
      if (packageRecord) {
        const itemId = crypto.randomUUID();
        let itemTotal = subtotalUsdCents;
        await db.orm.public.BookingItem.create({
          id: itemId,
          bookingId,
          productId: product.id,
          packageId: packageRecord.id,
          label: (await db.orm.public.Product.select("title").where((f) => f.id.eq(product.id)).limit(1).all())[0]?.title ?? "",
          packageLabel: packageRecord.label,
          unitKind: packageRecord.unitKind,
          adultCount: input.adult,
          childCount: input.child,
          infantCount: input.infant,
          unitUsdCents: packageRecord.unitKind === "per_pax"
            ? (packageRecord.adultUsdCents ?? 0)
            : (packageRecord.unitUsdCents ?? 0),
          totalUsdCents: itemTotal,
        });
      }

      // 3. BookingAddOn*
      for (const addOnInput of input.addOns) {
        const addOnRec = addOnRecords.find((r) => r.slug === addOnInput.slug);
        if (addOnRec) {
          const addOnId = crypto.randomUUID();
          await db.orm.public.BookingAddOn.create({
            id: addOnId,
            bookingId,
            addOnProductId: addOnRec.id,
            label: addOnRec.label,
            quantity: addOnInput.qty,
            unitUsdCents: addOnRec.unitUsdCents ?? 0,
            totalUsdCents: (addOnRec.unitUsdCents ?? 0) * addOnInput.qty,
          });
        }
      }

      // 4. Contact
      const contactId = crypto.randomUUID();
      await db.orm.public.Contact.create({
        id: contactId,
        bookingId,
        firstName: input.contact.firstName,
        lastName: input.contact.lastName,
        email: input.contact.email,
        phoneCountryCode: input.contact.phoneCountryCode,
        phone: input.contact.phone,
        isGuestSelf: input.contact.isGuestSelf,
        notes: input.contact.notes ?? null,
      });

      // 5. Traveler*
      for (let i = 0; i < input.travelers.length; i++) {
        const traveler = input.travelers[i];
        if (traveler) {
          const travelerId = crypto.randomUUID();
          await db.orm.public.Traveler.create({
            id: travelerId,
            bookingId,
            fullName: traveler.fullName,
            kind: traveler.kind,
            sortOrder: i,
          });
        }
      }

      // 6. FlightDetails
      const flightId = crypto.randomUUID();
      await db.orm.public.FlightDetails.create({
        id: flightId,
        bookingId,
        airportName: input.flight.airportName ?? null,
        location: input.flight.location ?? null,
        airline: input.flight.airline ?? null,
        flightCode: input.flight.flightCode ?? null,
        direction: input.flight.direction ?? null,
      });

      // 7. Payment (pending, methodId null)
      const paymentId = crypto.randomUUID();
      await db.orm.public.Payment.create({
        id: paymentId,
        bookingId,
        methodId: null,
        status: "pending",
        amountUsdCents: totalUsdCents,
        currencyCode: input.currencyCode,
        fxRate: input.fxRate,
      });

      return { ok: true, code };
    } catch (insertError) {
      // Compensating deletes
      console.error("[booking] insert failed, rolling back", insertError);
      try {
        await db.orm.public.Payment.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.FlightDetails.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.Traveler.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.Contact.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.BookingAddOn.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.BookingItem.where((f) => f.bookingId.eq(bookingId)).deleteAll();
        await db.orm.public.Booking.where((f) => f.id.eq(bookingId)).deleteAll();
      } catch (rollbackError) {
        console.error("[booking] rollback failed", rollbackError);
      }
      return { ok: false, error: "Failed to create booking. Please try again." };
    }
  } catch (error) {
    console.error("[booking] could not create booking", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * Lookup a booking by code + email.
 * Returns discriminated result: found with booking, or not found/error.
 */
export async function getBookingByCode(
  code: string,
  email: string
): Promise<BookingLookupResult> {
  try {
    // Find booking by code
    const bookings = await db.orm.public.Booking
      .select(
        "id",
        "code",
        "status",
        "serviceAt",
        "adultCount",
        "childCount",
        "infantCount",
        "subtotalUsdCents",
        "addOnsUsdCents",
        "totalUsdCents",
        "currencyCode",
        "fxRate",
        "createdAt"
      )
      .where((f) => f.code.eq(code))
      .limit(1)
      .all();

    const booking = bookings[0];
    if (!booking) return { found: false, reason: "not_found" };

    // Verify contact email matches
    const contacts = await db.orm.public.Contact
      .select("bookingId", "firstName", "lastName", "email", "phoneCountryCode", "phone")
      .where((f) => f.bookingId.eq(booking.id))
      .limit(1)
      .all();

    const contact = contacts[0];
    if (!contact || contact.email.toLowerCase() !== email.toLowerCase()) {
      return { found: false, reason: "not_found" };
    }

    // Get items
    const items = await db.orm.public.BookingItem
      .select("label", "packageLabel", "unitKind", "adultCount", "childCount", "infantCount", "unitUsdCents", "totalUsdCents")
      .where((f) => f.bookingId.eq(booking.id))
      .all();

    // Get add-ons
    const addOns = await db.orm.public.BookingAddOn
      .select("label", "quantity", "unitUsdCents", "totalUsdCents")
      .where((f) => f.bookingId.eq(booking.id))
      .all();

    // Get travelers
    const travelers = await db.orm.public.Traveler
      .select("fullName", "kind")
      .where((f) => f.bookingId.eq(booking.id))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    return {
      found: true,
      booking: {
        code: booking.code,
        status: booking.status,
        serviceAt: new Date(booking.serviceAt).toISOString(),
        adultCount: booking.adultCount,
        childCount: booking.childCount,
        infantCount: booking.infantCount,
        subtotalUsd: (booking.subtotalUsdCents ?? 0) / 100,
        addOnsUsd: (booking.addOnsUsdCents ?? 0) / 100,
        totalUsd: (booking.totalUsdCents ?? 0) / 100,
        currencyCode: booking.currencyCode,
        fxRate: booking.fxRate,
        items: items.map((item) => ({
          label: item.label,
          packageLabel: item.packageLabel ?? undefined,
          unitKind: item.unitKind,
          adultCount: item.adultCount,
          childCount: item.childCount,
          infantCount: item.infantCount,
          unitUsd: (item.unitUsdCents ?? 0) / 100,
          totalUsd: (item.totalUsdCents ?? 0) / 100,
        })),
        addOns: addOns.map((a) => ({
          label: a.label,
          quantity: a.quantity,
          unitUsd: (a.unitUsdCents ?? 0) / 100,
          totalUsd: (a.totalUsdCents ?? 0) / 100,
        })),
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phoneCountryCode: contact.phoneCountryCode,
          phone: contact.phone,
        },
        travelers: travelers.map((t) => ({
          fullName: t.fullName,
          kind: t.kind,
        })),
        createdAt: new Date(booking.createdAt).toISOString(),
      },
    };
  } catch (error) {
    console.error("[booking] could not lookup booking", error);
    return { found: false, reason: "error" };
  }
}
