"use server";

import { db } from "@/prisma/db";
import { getUserSession } from "@/lib/user/session";
import { getAdminAuth } from "@/lib/firebase";
import { signInWithPassword } from "@/lib/identity";
import {
  cardBrand,
  cardBrandLabel,
  encryptSecret,
  isValidCardNumber,
  normalizeCardNumber,
} from "@/lib/crypto";
import { generateApplicationCode } from "@/lib/invoice";
import { listLoyaltyLevels, resolveLevel, type LoyaltyLevelDTO } from "@/lib/loyalty";

/**
 * The customer account actions.
 *
 * Every action starts by reading the session cookie — an action is never
 * trusted to know who is calling it. When there is no session the action
 * refuses to do anything.
 *
 * The card number never leaves the server in clear: it is encrypted with
 * AES-256-GCM before it is stored, and only the last four digits are kept
 * in clear so the UI can show "•••• 4242". The CVV is never collected.
 */

export type AccountResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

function fail(error: string, field?: string): { ok: false; error: string; field?: string } {
  return { ok: false, error, field };
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export type AccountOverviewDTO = {
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  points: number;
  level: LoyaltyLevelDTO | null;
  nextLevel: LoyaltyLevelDTO | null;
  pointsToNext: number;
  memberSince: string;
};

/** The loyalty tiers, read from the database. */
export async function getLoyaltyLevels(): Promise<LoyaltyLevelDTO[]> {
  return listLoyaltyLevels();
}

/** The account summary shown on the hub page. */
export async function getAccountOverview(): Promise<AccountOverviewDTO | null> {
  const session = await getUserSession();
  if (!session) return null;

  const row = await db.orm.public.User
    .select("id", "name", "email", "phone", "emailVerified", "points", "createdAt")
    .where({ id: session.uid })
    .first();

  if (!row) return null;

  const levels = await listLoyaltyLevels();
  const level = resolveLevel(levels, row.points);
  const next = levels.find((l) => l.minPoints > row.points) ?? null;

  return {
    name: row.name ?? null,
    email: row.email,
    phone: row.phone ?? null,
    emailVerified: row.emailVerified,
    points: row.points,
    level,
    nextLevel: next,
    pointsToNext: next ? Math.max(0, next.minPoints - row.points) : 0,
    memberSince: new Date(row.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Update the name and the phone number of the signed-in customer. */
export async function updateAccountProfile(input: {
  name: string;
  phone: string;
}): Promise<AccountResult> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");

  const name = input.name.trim();
  const phone = input.phone.trim();

  if (name.length < 2) return fail("Nama minimal 2 karakter.", "name");
  if (phone && !/^[0-9+()\-\s]{6,20}$/.test(phone)) {
    return fail("Nomor telepon tidak valid.", "phone");
  }

  await db.orm.public.User.where({ id: session.uid }).update({
    name,
    phone: phone || null,
  });

  // Keep the Firebase display name in sync — it is what the header shows.
  try {
    await getAdminAuth().updateUser(session.uid, { displayName: name });
  } catch {
    // The database is the source of truth; a failed Firebase sync is not fatal.
  }

  return { ok: true, data: undefined };
}

/**
 * Change the password of the signed-in customer.
 *
 * The current password is verified through the Identity Toolkit (the same
 * call the login form uses) before the Admin SDK sets the new one.
 */
export async function changeAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AccountResult> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");

  if (!input.currentPassword) {
    return fail("Password saat ini wajib diisi.", "currentPassword");
  }
  if (input.newPassword.length < 8) {
    return fail("Password baru minimal 8 karakter.", "newPassword");
  }
  if (input.newPassword !== input.confirmPassword) {
    return fail("Konfirmasi password tidak sama.", "confirmPassword");
  }

  const signIn = await signInWithPassword(session.email, input.currentPassword);
  if (!signIn.ok) {
    return fail("Password saat ini salah.", "currentPassword");
  }

  try {
    await getAdminAuth().updateUser(session.uid, { password: input.newPassword });
  } catch {
    return fail("Gagal mengubah password. Coba lagi sebentar.");
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Saved cards
// ---------------------------------------------------------------------------

export type SavedCardDTO = {
  id: string;
  brand: string;
  brandLabel: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string | null;
  isDefault: boolean;
  createdAt: string;
};

/** The cards of the signed-in customer. */
export async function listSavedCards(): Promise<SavedCardDTO[]> {
  const session = await getUserSession();
  if (!session) return [];

  const rows = await db.orm.public.SavedCard
    .select("id", "brand", "last4", "expMonth", "expYear", "holderName", "isDefault", "createdAt")
    .where({ userId: session.uid })
    .orderBy((f) => f.createdAt.desc())
    .all();

  return rows.map((row) => ({
    id: row.id,
    brand: row.brand,
    brandLabel: cardBrandLabel(row.brand),
    last4: row.last4,
    expMonth: row.expMonth,
    expYear: row.expYear,
    holderName: row.holderName ?? null,
    isDefault: row.isDefault,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

/**
 * Save a payment card.
 *
 * The number is validated (Luhn), encrypted and stored; only the last four
 * digits are kept in clear. **No CVV is requested or stored** — the form
 * does not even have a field for it.
 */
export async function saveSavedCard(input: {
  number: string;
  expMonth: number;
  expYear: number;
  holderName: string;
}): Promise<AccountResult<{ id: string }>> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");

  const number = normalizeCardNumber(input.number);
  if (!number) return fail("Nomor kartu wajib diisi.", "number");
  if (!isValidCardNumber(number)) {
    return fail("Nomor kartu tidak valid. Periksa kembali.", "number");
  }

  const expMonth = Number(input.expMonth);
  const expYear = Number(input.expYear);

  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    return fail("Bulan kedaluwarsa tidak valid.", "expMonth");
  }
  if (!Number.isInteger(expYear) || expYear < 2000 || expYear > 2100) {
    return fail("Tahun kedaluwarsa tidak valid.", "expYear");
  }

  const now = new Date();
  const expiry = new Date(expYear, expMonth, 1);
  if (expiry <= now) {
    return fail("Kartu sudah kedaluwarsa.", "expYear");
  }

  const holderName = input.holderName.trim() || null;

  const count = await db.orm.public.SavedCard
    .where({ userId: session.uid })
    .aggregate((a) => ({ n: a.count() }));

  const card = await db.orm.public.SavedCard.create({
    id: crypto.randomUUID(),
    userId: session.uid,
    brand: cardBrand(number),
    last4: number.slice(-4),
    encryptedNumber: encryptSecret(number),
    expMonth,
    expYear,
    holderName,
    isDefault: count.n === 0,
  });

  return { ok: true, data: { id: card.id } };
}

/** Delete one of the customer's own cards. */
export async function deleteSavedCard(id: string): Promise<AccountResult> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");
  if (!id) return fail("Kartu tidak ditemukan.");

  const card = await db.orm.public.SavedCard
    .select("id", "userId")
    .where({ id })
    .first();

  // Only the owner may delete a card.
  if (!card || card.userId !== session.uid) {
    return fail("Kartu tidak ditemukan.");
  }

  await db.orm.public.SavedCard.where((f) => f.id.eq(id)).deleteAll();

  return { ok: true, data: undefined };
}

/** Make one of the customer's cards the default one. */
export async function setDefaultSavedCard(id: string): Promise<AccountResult> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");

  const card = await db.orm.public.SavedCard
    .select("id", "userId")
    .where({ id })
    .first();
  if (!card || card.userId !== session.uid) return fail("Kartu tidak ditemukan.");

  await db.orm.public.SavedCard.where({ userId: session.uid }).update({ isDefault: false });
  await db.orm.public.SavedCard.where((f) => f.id.eq(id)).update({ isDefault: true });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type ReviewReplyDTO = {
  id: string;
  body: string;
  rating: number;
  views: number;
  likes: number;
  createdAt: string;
  replies: ReviewReplyDTO[];
};

export type MyReviewDTO = {
  id: string;
  subjectType: string;
  subjectId: string;
  subjectLabel: string;
  rating: number;
  body: string;
  views: number;
  likes: number;
  replyCount: number;
  createdAt: string;
  replies: ReviewReplyDTO[];
};

/** The customer's own reviews, with their replies (parent → child → child). */
export async function listMyReviews(): Promise<MyReviewDTO[]> {
  const session = await getUserSession();
  if (!session) return [];

  const rows = await db.orm.public.Review
    .select("id", "subjectType", "subjectId", "rating", "body", "views", "likes", "parentId", "createdAt")
    .where({ userId: session.uid })
    .orderBy((f) => f.createdAt.desc())
    .all();

  const roots = rows.filter((row) => row.parentId === null);
  const byParent = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }

  const labels = await resolveSubjectLabels(
    rows.map((row) => ({ type: row.subjectType, id: row.subjectId })),
  );

  const buildReplies = (parentId: string): ReviewReplyDTO[] =>
    (byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      body: row.body,
      rating: row.rating,
      views: row.views,
      likes: row.likes,
      createdAt: new Date(row.createdAt).toISOString(),
      replies: buildReplies(row.id),
    }));

  const countReplies = (parentId: string): number =>
    (byParent.get(parentId) ?? []).reduce(
      (sum, row) => sum + 1 + countReplies(row.id),
      0,
    );

  return roots.map((row) => ({
    id: row.id,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    subjectLabel: labels.get(`${row.subjectType}:${row.subjectId}`) ?? "Layanan",
    rating: row.rating,
    body: row.body,
    views: row.views,
    likes: row.likes,
    replyCount: countReplies(row.id),
    createdAt: new Date(row.createdAt).toISOString(),
    replies: buildReplies(row.id),
  }));
}

/** Resolve the "product" / "service line" labels of the reviewed subjects. */
async function resolveSubjectLabels(
  subjects: { type: string; id: string }[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();

  const productIds = subjects.filter((s) => s.type === "product").map((s) => s.id);
  const lineIds = subjects.filter((s) => s.type !== "product").map((s) => s.id);

  if (productIds.length > 0) {
    const products = await db.orm.public.Product
      .select("id", "title")
      .where((f) => f.id.in(productIds))
      .all();
    for (const product of products) {
      labels.set(`product:${product.id}`, product.title);
    }
  }

  if (lineIds.length > 0) {
    const lines = await db.orm.public.ServiceLine
      .select("id", "label")
      .where((f) => f.id.in(lineIds))
      .all();
    for (const line of lines) {
      labels.set(`serviceLine:${line.id}`, line.label);
    }
  }

  return labels;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type MyOrderDTO = {
  id: string;
  code: string;
  invoiceNumber: string | null;
  status: string;
  serviceAt: string;
  createdAt: string;
  totalUsdCents: number;
  subtotalUsdCents: number;
  discountUsdCents: number;
  taxUsdCents: number;
  promoCode: string | null;
  itemLabel: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
};

/** The order history of the signed-in customer. */
export async function listMyOrders(): Promise<MyOrderDTO[]> {
  const session = await getUserSession();
  if (!session) return [];

  const rows = await db.orm.public.Booking
    .select(
      "id",
      "code",
      "invoiceNumber",
      "status",
      "serviceAt",
      "createdAt",
      "totalUsdCents",
      "subtotalUsdCents",
      "discountUsdCents",
      "taxUsdCents",
      "promoCode",
      "adultCount",
      "childCount",
      "infantCount",
    )
    .where((f) => f.userId.eq(session.uid))
    .orderBy((f) => f.createdAt.desc())
    .all();

  // The label of the first item tells which service was booked.
  const items = await db.orm.public.BookingItem
    .select("bookingId", "label")
    .where((f) => f.bookingId.in(rows.map((r) => r.id)))
    .all();

  const labelByBooking = new Map<string, string>();
  for (const item of items) {
    if (!labelByBooking.has(item.bookingId)) {
      labelByBooking.set(item.bookingId, item.label);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    invoiceNumber: row.invoiceNumber ?? null,
    status: row.status,
    serviceAt: new Date(row.serviceAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    totalUsdCents: row.totalUsdCents,
    subtotalUsdCents: row.subtotalUsdCents,
    discountUsdCents: row.discountUsdCents,
    taxUsdCents: row.taxUsdCents,
    promoCode: row.promoCode ?? null,
    itemLabel: labelByBooking.get(row.id) ?? "Layanan",
    adultCount: row.adultCount,
    childCount: row.childCount,
    infantCount: row.infantCount,
  }));
}

export type InvoiceDTO = {
  code: string;
  invoiceNumber: string | null;
  status: string;
  serviceAt: string;
  createdAt: string;
  currencyCode: string;
  fxRate: number;
  subtotalUsdCents: number;
  addOnsUsdCents: number;
  discountUsdCents: number;
  taxUsdCents: number;
  totalUsdCents: number;
  promoCode: string | null;
  taxes: { key: string; label: string; value: string; amountUsdCents: number }[];
  items: {
    label: string;
    packageLabel: string | null;
    unitKind: string;
    adultCount: number;
    childCount: number;
    infantCount: number;
    unitUsdCents: number;
    totalUsdCents: number;
  }[];
  addOns: { label: string; quantity: number; unitUsdCents: number; totalUsdCents: number }[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phone: string;
  } | null;
  travelers: { fullName: string; kind: string }[];
};

/** The full invoice of one of the customer's own bookings. */
export async function getMyInvoice(code: string): Promise<InvoiceDTO | null> {
  const session = await getUserSession();
  if (!session) return null;

  const rows = await db.orm.public.Booking
    .select(
      "id",
      "code",
      "invoiceNumber",
      "status",
      "serviceAt",
      "createdAt",
      "currencyCode",
      "fxRate",
      "subtotalUsdCents",
      "addOnsUsdCents",
      "discountUsdCents",
      "taxUsdCents",
      "totalUsdCents",
      "promoCode",
      "taxes",
    )
    .where((f) => f.code.eq(code))
    .where((f) => f.userId.eq(session.uid))
    .limit(1)
    .all();

  const booking = rows[0];
  if (!booking) return null;

  const [items, addOns, contacts, travelers] = await Promise.all([
    db.orm.public.BookingItem
      .select(
        "label",
        "packageLabel",
        "unitKind",
        "adultCount",
        "childCount",
        "infantCount",
        "unitUsdCents",
        "totalUsdCents",
      )
      .where((f) => f.bookingId.eq(booking.id))
      .all(),
    db.orm.public.BookingAddOn
      .select("label", "quantity", "unitUsdCents", "totalUsdCents")
      .where((f) => f.bookingId.eq(booking.id))
      .all(),
    db.orm.public.Contact
      .select("firstName", "lastName", "email", "phoneCountryCode", "phone")
      .where((f) => f.bookingId.eq(booking.id))
      .limit(1)
      .all(),
    db.orm.public.Traveler
      .select("fullName", "kind")
      .where((f) => f.bookingId.eq(booking.id))
      .all(),
  ]);

  const contact = contacts[0] ?? null;

  return {
    code: booking.code,
    invoiceNumber: booking.invoiceNumber ?? null,
    status: booking.status,
    serviceAt: new Date(booking.serviceAt).toISOString(),
    createdAt: new Date(booking.createdAt).toISOString(),
    currencyCode: booking.currencyCode,
    fxRate: booking.fxRate,
    subtotalUsdCents: booking.subtotalUsdCents,
    addOnsUsdCents: booking.addOnsUsdCents,
    discountUsdCents: booking.discountUsdCents,
    taxUsdCents: booking.taxUsdCents,
    totalUsdCents: booking.totalUsdCents,
    promoCode: booking.promoCode ?? null,
    taxes: parseTaxLines(booking.taxes),
    items: items.map((item) => ({
      label: item.label,
      packageLabel: item.packageLabel ?? null,
      unitKind: item.unitKind,
      adultCount: item.adultCount,
      childCount: item.childCount,
      infantCount: item.infantCount,
      unitUsdCents: item.unitUsdCents,
      totalUsdCents: item.totalUsdCents,
    })),
    addOns: addOns.map((addOn) => ({
      label: addOn.label,
      quantity: addOn.quantity,
      unitUsdCents: addOn.unitUsdCents,
      totalUsdCents: addOn.totalUsdCents,
    })),
    contact: contact
      ? {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phoneCountryCode: contact.phoneCountryCode,
          phone: contact.phone,
        }
      : null,
    travelers: travelers.map((traveler) => ({
      fullName: traveler.fullName,
      kind: traveler.kind,
    })),
  };
}

/** Read the tax lines stored on a booking. */
function parseTaxLines(value: unknown): { key: string; label: string; value: string; amountUsdCents: number }[] {
  if (!Array.isArray(value)) return [];
  const lines: { key: string; label: string; value: string; amountUsdCents: number }[] = [];
  for (const item of value) {
    const line = item as {
      key?: string;
      label?: string;
      value?: string;
      amountUsdCents?: number;
    };
    if (!line?.key) continue;
    lines.push({
      key: line.key,
      label: line.label ?? line.key,
      value: line.value ?? "",
      amountUsdCents: line.amountUsdCents ?? 0,
    });
  }
  return lines;
}

// ---------------------------------------------------------------------------
// e-VOA visa applications
// ---------------------------------------------------------------------------

export type VisaApplicationDTO = {
  id: string;
  code: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  arrivalDate: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
};

/** The visa applications of the signed-in customer. */
export async function listMyVisaApplications(): Promise<VisaApplicationDTO[]> {
  const session = await getUserSession();
  if (!session) return [];

  const rows = await db.orm.public.VisaApplication
    .select(
      "id",
      "code",
      "fullName",
      "passportNumber",
      "nationality",
      "dateOfBirth",
      "arrivalDate",
      "email",
      "phone",
      "status",
      "createdAt",
    )
    .where({ userId: session.uid })
    .orderBy((f) => f.createdAt.desc())
    .all();

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    passportNumber: row.passportNumber,
    nationality: row.nationality,
    dateOfBirth: new Date(row.dateOfBirth).toISOString(),
    arrivalDate: new Date(row.arrivalDate).toISOString(),
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

/**
 * Submit a visa application (the e-VOA service).
 *
 * The customer fills in the passport data of the person the visa is for —
 * we handle the application.
 */
export async function submitVisaApplication(input: {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  arrivalDate: string;
  email: string;
  phone: string;
  notes?: string;
}): Promise<AccountResult<{ code: string }>> {
  const session = await getUserSession();
  if (!session) return fail("Sesi tidak valid. Silakan masuk kembali.");

  const fullName = input.fullName.trim();
  const passportNumber = input.passportNumber.trim().toUpperCase();
  const nationality = input.nationality.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (fullName.length < 3) return fail("Nama lengkap wajib diisi.", "fullName");
  if (!/^[A-Z0-9]{6,12}$/.test(passportNumber)) {
    return fail("Nomor paspor tidak valid.", "passportNumber");
  }
  if (!nationality) return fail("Kewarganegaraan wajib diisi.", "nationality");

  const dob = new Date(input.dateOfBirth);
  if (!Number.isFinite(dob.getTime())) {
    return fail("Tanggal lahir tidak valid.", "dateOfBirth");
  }

  const arrival = new Date(input.arrivalDate);
  if (!Number.isFinite(arrival.getTime())) {
    return fail("Tanggal kedatangan tidak valid.", "arrivalDate");
  }
  if (arrival < new Date()) {
    return fail("Tanggal kedatangan tidak boleh sudah lewat.", "arrivalDate");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Email tidak valid.", "email");
  if (!/^[0-9+()\-\s]{6,20}$/.test(phone)) {
    return fail("Nomor telepon tidak valid.", "phone");
  }

  const application = await db.orm.public.VisaApplication.create({
    id: crypto.randomUUID(),
    code: generateApplicationCode(),
    userId: session.uid,
    fullName,
    passportNumber,
    nationality,
    dateOfBirth: dob,
    arrivalDate: arrival,
    email,
    phone,
    status: "submitted",
    note: input.notes?.trim() || null,
  });

  return { ok: true, data: { code: application.code } };
}
