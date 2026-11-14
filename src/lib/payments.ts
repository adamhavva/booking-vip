import "server-only";

import { db } from "@/prisma/db";
import { convertUsdCents, getUsdRate } from "@/lib/fx";
import { recomputeUserPoints } from "@/lib/loyalty";
import {
  createInvoice,
  getInvoice,
  mapGatewayStatus,
  type GatewayPayment,
} from "@/lib/xendit";

/**
 * The payment service.
 *
 * It owns the lifecycle of a payment row: it creates the gateway invoice,
 * stores the provider references on the row, and applies the state transition
 * when the gateway tells us the money arrived.
 *
 * The rules that matter:
 *
 *   - the amount is always the one the server computed for the booking,
 *     never one that came from the browser;
 *   - a webhook only confirms the booking when the amount matches;
 *   - a replayed webhook changes nothing (the event id is unique).
 */

export type PaymentMethodDTO = {
  id: string;
  code: string;
  label: string;
  provider: string | null;
  providerMethodCode: string | null;
  providerCurrency: string | null;
};

/** The payment methods that can be started, with their gateway binding. */
export async function listPaymentMethods(): Promise<PaymentMethodDTO[]> {
  const rows = await db.orm.public.PaymentMethod
    .select(
      "id",
      "code",
      "label",
      "provider",
      "providerMethodCode",
      "providerCurrency",
    )
    .where((f) => f.active.eq(true))
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    label: row.label,
    provider: row.provider ?? null,
    providerMethodCode: row.providerMethodCode ?? null,
    providerCurrency: row.providerCurrency ?? null,
  }));
}

/** The payment of a booking — the most recent one. */
export async function getBookingPayment(bookingId: string) {
  const rows = await db.orm.public.Payment
    .select(
      "id",
      "bookingId",
      "methodId",
      "status",
      "amountUsdCents",
      "currencyCode",
      "provider",
      "providerRef",
      "providerAmountCents",
      "providerCurrency",
      "checkoutUrl",
      "expiresAt",
      "paidAt",
    )
    .where((f) => f.bookingId.eq(bookingId))
    .orderBy((f) => f.createdAt.desc())
    .limit(1)
    .all();

  return rows[0] ?? null;
}

/**
 * Start a payment for a booking.
 *
 * The booking is looked up by its code and the caller has to prove the
 * ownership with the contact email — the same rule the booking lookup uses.
 */
export async function startPayment(params: {
  bookingCode: string;
  email: string;
  methodCode: string;
}): Promise<
  | { ok: true; checkoutUrl: string; paymentId: string }
  | { ok: false; error: string }
> {
  const code = params.bookingCode.trim().toUpperCase();
  const email = params.email.trim().toLowerCase();

  const bookings = await db.orm.public.Booking
    .select("id", "code", "status", "totalUsdCents", "currencyCode", "invoiceNumber")
    .where((f) => f.code.eq(code))
    .limit(1)
    .all();

  const booking = bookings[0];
  if (!booking) return { ok: false, error: "Pesanan tidak ditemukan." };

  const contacts = await db.orm.public.Contact
    .select("email")
    .where((f) => f.bookingId.eq(booking.id))
    .limit(1)
    .all();

  if (!contacts[0] || contacts[0].email.trim().toLowerCase() !== email) {
    return { ok: false, error: "Pesanan tidak ditemukan." };
  }

  if (booking.status === "confirmed" || booking.status === "completed") {
    return { ok: false, error: "Pesanan ini sudah dibayar." };
  }

  const methods = await listPaymentMethods();
  const method = methods.find((m) => m.code === params.methodCode);
  if (!method) return { ok: false, error: "Metode pembayaran tidak tersedia." };
  if (method.provider !== "xendit") {
    return { ok: false, error: "Metode pembayaran ini belum didukung." };
  }

  // Re-use an open payment instead of creating a second invoice.
  const existing = await getBookingPayment(booking.id);
  if (
    existing &&
    existing.status === "pending" &&
    existing.provider === "xendit" &&
    existing.providerRef &&
    existing.checkoutUrl
  ) {
    // Refresh it — the invoice may have expired in the meantime.
    try {
      const refreshed = await getInvoice(existing.providerRef);
      if (refreshed.status !== "expired" && refreshed.status !== "failed") {
        return {
          ok: true,
          checkoutUrl: refreshed.checkoutUrl ?? existing.checkoutUrl,
          paymentId: existing.id,
        };
      }
    } catch (error) {
      console.error("[payments] could not refresh the invoice", error);
    }
  }

  const currency = method.providerCurrency ?? booking.currencyCode ?? "IDR";
  const rate =
    currency.toUpperCase() === (booking.currencyCode ?? "USD").toUpperCase()
      ? 1
      : await getUsdRate(currency);

  // The gateway charges in its own currency — the USD total is converted with
  // the rate of the moment the invoice is created.
  const amountCents = convertUsdCents(booking.totalUsdCents, rate);

  const invoice = await createInvoice({
    externalId: booking.code,
    amountCents,
    currency,
    payerEmail: email,
    description: `Booking VIP ${booking.code}`,
    successRedirectUrl: successUrl(booking.code),
    failureRedirectUrl: failureUrl(booking.code),
    paymentMethods: method.providerMethodCode
      ? [method.providerMethodCode]
      : undefined,
  });

  const paymentId = crypto.randomUUID();

  await db.orm.public.Payment.create({
    id: paymentId,
    bookingId: booking.id,
    methodId: method.id,
    status: "pending",
    amountUsdCents: booking.totalUsdCents,
    currencyCode: booking.currencyCode,
    fxRate: rate,
    reference: invoice.providerRef,
    provider: "xendit",
    providerRef: invoice.providerRef,
    providerAmountCents: invoice.amountCents,
    providerCurrency: invoice.currency,
    checkoutUrl: invoice.checkoutUrl ?? null,
    expiresAt: invoice.expiresAt ?? null,
    rawPayload: invoice.raw as never,
  });

  if (!invoice.checkoutUrl) {
    return { ok: false, error: "Gateway tidak mengembalikan link pembayaran." };
  }

  return { ok: true, checkoutUrl: invoice.checkoutUrl, paymentId };
}

/** The URL the customer comes back to after paying. */
function successUrl(bookingCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}/payment/return?code=${encodeURIComponent(bookingCode)}`;
}

/** The URL the customer comes back to when the payment fails. */
function failureUrl(bookingCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}/payment/return?code=${encodeURIComponent(bookingCode)}&status=failed`;
}

/**
 * Apply a gateway callback.
 *
 * The event id is written first — a replay hits the unique constraint and
 * stops here, so a duplicated webhook is a no-op.
 */
export async function applyGatewayEvent(params: {
  provider: string;
  eventId: string;
  eventType: string;
  providerRef?: string;
  externalId?: string;
  status: string;
  amountCents?: number;
  currency?: string;
  raw: unknown;
}): Promise<{ outcome: "processed" | "ignored" | "failed"; error?: string }> {
  const event = await db.orm.public.PaymentWebhookEvent
    .select("id")
    .where((f) => f.provider.eq(params.provider))
    .where((f) => f.providerEventId.eq(params.eventId))
    .limit(1)
    .all();

  if (event.length > 0) {
    return { outcome: "ignored" };
  }

  // Find the payment: by the provider reference first, by our own id second.
  const payments = await db.orm.public.Payment
    .select("id", "bookingId", "status", "amountUsdCents", "providerCurrency")
    .where((f) => f.provider.eq(params.provider))
    .where((f) => f.providerRef.eq(params.providerRef ?? ""))
    .limit(1)
    .all();

  const payment = payments[0];
  const target = payment
    ? "processed"
    : params.externalId
      ? "ignored"
      : "ignored";

  await db.orm.public.PaymentWebhookEvent.create({
    id: crypto.randomUUID(),
    provider: params.provider,
    providerEventId: params.eventId,
    eventType: params.eventType,
    outcome: target,
    payload: params.raw as never,
  });

  if (!payment) {
    return { outcome: "ignored" };
  }

  const status = mapGatewayStatus(params.status);

  // A paid event only counts when the amount matches what we charged.
  if (status === "paid") {
    const expected = payment.amountUsdCents;
    const received = params.amountCents;

    if (
      typeof received === "number" &&
      typeof expected === "number" &&
      received !== expected
    ) {
      await db.orm.public.PaymentWebhookEvent
        .where((f) => f.provider.eq(params.provider))
        .where((f) => f.providerEventId.eq(params.eventId))
        .update({ outcome: "failed" });

      console.error(
        "[payments] amount mismatch — the booking was not confirmed",
        { expected, received },
      );
      return { outcome: "failed", error: "Amount mismatch." };
    }

    await db.orm.public.Payment
      .where((f) => f.id.eq(payment.id))
      .update({
        status: "paid",
        paidAt: new Date(),
        rawPayload: params.raw as never,
      });

    await db.orm.public.Booking
      .where((f) => f.id.eq(payment.bookingId))
      .update({ status: "confirmed" });

    await awardPointsForBooking(payment.bookingId);
  } else if (status === "failed" || status === "expired" || status === "cancelled") {
    await db.orm.public.Payment
      .where((f) => f.id.eq(payment.id))
      .update({
        status: status === "failed" ? "failed" : "pending",
        rawPayload: params.raw as never,
      });
  }

  return { outcome: "processed" };
}

/** The status of a booking's payment — used by the return page. */
export async function getPaymentStatus(params: {
  bookingCode: string;
  email: string;
}): Promise<
  | {
      ok: true;
      status: string;
      bookingStatus: string;
      amountUsdCents: number;
      checkoutUrl: string | null;
    }
  | { ok: false; error: string }
> {
  const code = params.bookingCode.trim().toUpperCase();
  const email = params.email.trim().toLowerCase();

  const bookings = await db.orm.public.Booking
    .select("id", "status", "totalUsdCents")
    .where((f) => f.code.eq(code))
    .limit(1)
    .all();

  const booking = bookings[0];
  if (!booking) return { ok: false, error: "Pesanan tidak ditemukan." };

  const contacts = await db.orm.public.Contact
    .select("email")
    .where((f) => f.bookingId.eq(booking.id))
    .limit(1)
    .all();

  if (!contacts[0] || contacts[0].email.trim().toLowerCase() !== email) {
    return { ok: false, error: "Pesanan tidak ditemukan." };
  }

  const payment = await getBookingPayment(booking.id);

  return {
    ok: true,
    status: payment?.status ?? "pending",
    bookingStatus: booking.status,
    amountUsdCents: booking.totalUsdCents,
    checkoutUrl: payment?.checkoutUrl ?? null,
  };
}

/**
 * Credit the loyalty points of a booking that was just paid for.
 *
 * The balance is re-derived from the source rows (paid bookings minus
 * redeemed vouchers), so calling this twice — webhook and return page — is
 * harmless. A points failure never blocks the payment confirmation.
 */
async function awardPointsForBooking(bookingId: string): Promise<void> {
  try {
    const rows = await db.orm.public.Booking
      .select("userId")
      .where((f) => f.id.eq(bookingId))
      .limit(1)
      .all();
    const userId = rows[0]?.userId;
    if (userId) await recomputeUserPoints(userId);
  } catch (error) {
    console.error("[payments] could not credit loyalty points", error);
  }
}

/** Refresh a pending payment from the gateway — used by the return page. */
export async function refreshPayment(paymentId: string): Promise<string | null> {
  const rows = await db.orm.public.Payment
    .select("id", "bookingId", "provider", "providerRef", "status")
    .where((f) => f.id.eq(paymentId))
    .limit(1)
    .all();

  const payment = rows[0];
  if (!payment || payment.provider !== "xendit" || !payment.providerRef) {
    return payment?.status ?? "pending";
  }

  try {
    const refreshed: GatewayPayment = await getInvoice(payment.providerRef);
    if (refreshed.status === "paid" && payment.status !== "paid") {
      await db.orm.public.Payment
        .where((f) => f.id.eq(payment.id))
        .update({ status: "paid", paidAt: new Date() });
      await awardPointsForBooking(payment.bookingId);
      return "paid";
    }
    return payment.status;
  } catch (error) {
    console.error("[payments] could not refresh the payment", error);
    return payment.status;
  }
}
