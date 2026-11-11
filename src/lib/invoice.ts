/**
 * Invoice numbers.
 *
 * The format is fixed:
 *
 *   #INV/TAHUN/BULAN/TANGGAL/4DIGIT/2RANDOM STRING
 *
 *   #INV/2026/11/12/4821/KQ
 *
 * `TAHUN/BULAN/TANGGAL` is the booking date, the four digits and the two
 * letters are random — together they make the number unique.
 */

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O, Q-like confusions
const DIGITS = "0123456789";

/** Random characters out of an alphabet. */
function randomFrom(alphabet: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

/**
 * Build an invoice number for a date.
 *
 * `date` defaults to now; the parts are zero-padded (`11`, not `1`).
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const block = randomFrom(DIGITS, 4);
  const suffix = randomFrom(LETTERS, 2);

  return `#INV/${year}/${month}/${day}/${block}/${suffix}`;
}

/**
 * A human readable application number (e-VOA).
 *
 * `EVA/YYYY/MM/DD/4DIGIT/2RANDOM` — the same shape as the invoice number.
 */
export function generateApplicationCode(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const block = randomFrom(DIGITS, 4);
  const suffix = randomFrom(LETTERS, 2);

  return `EVA/${year}/${month}/${day}/${block}/${suffix}`;
}

/** The URL of the printable invoice of a booking. */
export function invoicePath(code: string): string {
  return `/account/orders/${encodeURIComponent(code)}/invoice`;
}
