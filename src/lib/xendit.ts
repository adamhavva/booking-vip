import "server-only";

/**
 * The Xendit gateway.
 *
 * Xendit is the payment provider: it settles virtual accounts, QRIS, e-wallets
 * and cards, and it tells us about the result through a webhook. PayPal is
 * kept as a link only, so it has no client here yet.
 *
 * The secret key never leaves the server — everything in this module is
 * server-only, and no provider secret is ever returned to the browser.
 */

const XENDIT_API = "https://api.xendit.co";

/** The Xendit statuses we care about, mapped onto ours. */
export type GatewayStatus =
  | "pending"
  | "requires_action"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";

/** A normalized payment as returned by the gateway. */
export type GatewayPayment = {
  /** The provider-side id (the invoice id). */
  providerRef: string;
  status: GatewayStatus;
  /** The amount charged, in the provider currency (cents). */
  amountCents: number;
  currency: string;
  /** Where the customer has to go to pay. */
  checkoutUrl?: string;
  expiresAt?: Date;
  /** The raw provider payload — stored on the payment for auditing. */
  raw: unknown;
};

/** The payload of an invoice callback. */
export type XenditCallback = {
  id?: string;
  external_id?: string;
  status?: string;
  amount?: number;
  paid_amount?: number;
  payer_email?: string;
  payment_method?: string;
  payment_channel?: string;
  payment_destination?: string;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  created?: string;
  updated?: string;
  currency?: string;
  paid_at?: string;
  mid_label?: string;
  payment_id?: string;
  payment_method_id?: string;
  basket?: unknown[];
  metadata?: Record<string, unknown>;
};

/** Is the Xendit secret configured? */
export function isXenditConfigured(): boolean {
  return Boolean(process.env.XENDIT_SECRET_API_KEY);
}

/** The secret key, or `null` when Xendit is not configured. */
function secretKey(): string | null {
  const key = process.env.XENDIT_SECRET_API_KEY?.trim();
  return key ? key : null;
}

/** The public base URL of this deployment — used for the redirect URLs. */
function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Map an Xendit status onto ours. */
export function mapGatewayStatus(status: string | undefined): GatewayStatus {
  switch ((status ?? "").toUpperCase()) {
    case "PAID":
    case "SETTLED":
      return "paid";
    case "EXPIRED":
      return "expired";
    case "FAILED":
    case "VOIDED":
      return "failed";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    case "PENDING":
      return "pending";
    default:
      return "requires_action";
  }
}

/** Perform an authenticated Xendit API call. */
async function xenditFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const key = secretKey();
  if (!key) {
    throw new Error("XENDIT_SECRET_API_KEY is not configured.");
  }

  const response = await fetch(`${XENDIT_API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      // Xendit uses HTTP basic auth with the secret key as the username.
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    const message =
      (payload as { message?: string })?.message ??
      `Xendit request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export type CreateInvoiceInput = {
  /** Our booking code — the idempotency anchor on the Xendit side. */
  externalId: string;
  /** The amount in the settlement currency (cents). */
  amountCents: number;
  currency: string;
  payerEmail?: string;
  description: string;
  /** The booking code the customer returns to after paying. */
  successRedirectUrl: string;
  failureRedirectUrl: string;
  /** The Xendit methods this invoice may be paid with. */
  paymentMethods?: string[];
  /** How long the invoice stays open, in seconds. */
  expiresInSeconds?: number;
};

/**
 * Create an invoice and return the checkout URL the customer has to visit.
 *
 * The invoice is created with `external_id = booking code`, so a retry for
 * the same booking reuses the same anchor and never double-charges.
 */
export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<GatewayPayment> {
  const body: Record<string, unknown> = {
    external_id: input.externalId,
    amount: input.amountCents / 100,
    currency: input.currency,
    description: input.description,
    success_redirect_url: input.successRedirectUrl,
    failure_redirect_url: input.failureRedirectUrl,
    invoice_duration: input.expiresInSeconds ?? 24 * 60 * 60,
    should_send_email: false,
  };

  if (input.payerEmail) body.payer_email = input.payerEmail;
  if (input.paymentMethods?.length) body.payment_methods = input.paymentMethods;

  const payload = await xenditFetch<{
    id: string;
    status: string;
    amount: number;
    invoice_url?: string;
    invoice_duration?: number;
    created?: string;
  }>("/v2/invoices", { method: "POST", body });

  return {
    providerRef: payload.id,
    status: mapGatewayStatus(payload.status),
    amountCents: Math.round((payload.amount ?? input.amountCents / 100) * 100),
    currency: input.currency,
    checkoutUrl: payload.invoice_url,
    expiresAt: payload.created
      ? new Date(
          new Date(payload.created).getTime() +
            (payload.invoice_duration ?? input.expiresInSeconds ?? 86400) * 1000,
        )
      : undefined,
    raw: payload,
  };
}

/** Read an invoice back from Xendit. */
export async function getInvoice(providerRef: string): Promise<GatewayPayment> {
  const payload = await xenditFetch<{
    id: string;
    status: string;
    amount: number;
    currency?: string;
    invoice_url?: string;
    invoice_duration?: number;
    created?: string;
  }>(`/v2/invoices/${encodeURIComponent(providerRef)}`);

  return {
    providerRef: payload.id,
    status: mapGatewayStatus(payload.status),
    amountCents: Math.round((payload.amount ?? 0) * 100),
    currency: payload.currency ?? "IDR",
    checkoutUrl: payload.invoice_url,
    expiresAt: payload.created
      ? new Date(
          new Date(payload.created).getTime() +
            (payload.invoice_duration ?? 86400) * 1000,
        )
      : undefined,
    raw: payload,
  };
}

/**
 * Verify the callback token Xendit sends with every callback.
 *
 * Xendit puts the token in the `x-callback-token` header; it is configured on
 * the Xendit dashboard and must match `XENDIT_CALLBACK_TOKEN`.
 */
export function verifyCallbackToken(headerValue: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN?.trim();
  if (!expected) return false;
  if (!headerValue) return false;
  return headerValue.trim() === expected;
}

/** The redirect URL the customer comes back to after paying. */
export function successRedirectUrl(bookingCode: string): string {
  return `${appUrl()}/payment/return?code=${encodeURIComponent(bookingCode)}`;
}

/** The redirect URL the customer comes back to when the payment fails. */
export function failureRedirectUrl(bookingCode: string): string {
  return `${appUrl()}/payment/return?code=${encodeURIComponent(bookingCode)}&status=failed`;
}

/**
 * The Xendit method code for one of our payment methods.
 *
 * The mapping lives on the `PaymentMethod` row (`providerMethodCode`), so the
 * admin can change it without a deploy.
 */
export function xenditMethodCode(providerMethodCode: string | null): string | null {
  if (!providerMethodCode) return null;
  return providerMethodCode.toUpperCase();
}
