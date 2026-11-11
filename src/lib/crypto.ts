import "server-only";

import crypto from "node:crypto";

/**
 * Card encryption.
 *
 * A saved card number is never stored in clear: it is encrypted with
 * AES-256-GCM before it reaches the database. Only the last four digits are
 * kept in clear so the UI can show "•••• 4242".
 *
 * The key comes from the environment (`CARD_ENCRYPTION_KEY`) and must be 32
 * bytes — hex (64 characters) or base64. When it is missing, a deterministic
 * development key is derived so local work still functions; the production
 * deployment must set the variable.
 */

const DEV_KEY_SALT = "booking-vip::card-encryption::dev";

let cachedKey: Buffer | null = null;

/** Decode the configured key (hex, base64 or raw passphrase). */
function readKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.CARD_ENCRYPTION_KEY?.trim();

  if (!raw) {
    // Development fallback — deterministic, so encrypted rows stay readable
    // across restarts on a developer machine.
    cachedKey = crypto.createHash("sha256").update(DEV_KEY_SALT).digest();
    return cachedKey;
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    cachedKey = Buffer.from(raw, "hex");
    return cachedKey;
  }

  if (/^[A-Za-z0-9+/=]{40,}$/.test(raw)) {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) {
      cachedKey = decoded;
      return cachedKey;
    }
  }

  // Any other passphrase is stretched to 32 bytes.
  cachedKey = crypto.createHash("sha256").update(raw).digest();
  return cachedKey;
}

/**
 * Encrypt a plaintext string.
 *
 * The stored format is `v1:<iv>:<authTag>:<ciphertext>` (all base64url) so
 * the version can be changed later without guessing the layout.
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", readKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

/**
 * Decrypt a value produced by {@link encryptSecret}.
 *
 * Returns null when the payload is malformed or the key does not match — a
 * tampered row must never crash the account page.
 */
export function decryptSecret(payload: string): string | null {
  try {
    const parts = payload.split(":");
    if (parts.length !== 4 || parts[0] !== "v1") return null;

    const iv = Buffer.from(parts[1]!, "base64url");
    const authTag = Buffer.from(parts[2]!, "base64url");
    const encrypted = Buffer.from(parts[3]!, "base64url");

    const decipher = crypto.createDecipheriv("aes-256-gcm", readKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Strip everything but the digits of a card number. */
export function normalizeCardNumber(value: string): string {
  return value.replace(/\D+/g, "");
}

/** Detect the card brand from the number prefix. */
export function cardBrand(number: string): string {
  if (/^4/.test(number)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  if (/^35/.test(number)) return "jcb";
  if (/^6(?:011|5)/.test(number)) return "discover";
  return "card";
}

/** Human readable brand label. */
export function cardBrandLabel(brand: string): string {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "American Express";
    case "jcb":
      return "JCB";
    case "discover":
      return "Discover";
    default:
      return "Kartu";
  }
}

/**
 * The Luhn check — the standard sanity check for a card number.
 *
 * The card is never sent to the gateway from this project yet (the Xendit
 * integration comes later), so this is the only validation we can do here.
 */
export function isValidCardNumber(number: string): boolean {
  const digits = normalizeCardNumber(number);
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}
