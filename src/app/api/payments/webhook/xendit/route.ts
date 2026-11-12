import { NextResponse } from "next/server";
import { applyGatewayEvent } from "@/lib/payments";
import { verifyCallbackToken, type XenditCallback } from "@/lib/xendit";

/**
 * The Xendit webhook.
 *
 * Xendit posts every invoice state change here. The callback token in the
 * `x-callback-token` header is verified first — an event without a valid
 * token is recorded as failed and changes nothing.
 */

/** Map an Xendit invoice status onto our own vocabulary. */
function gatewayStatus(status: string | undefined): string {
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
    default:
      return "pending";
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("x-callback-token");

  if (!verifyCallbackToken(token)) {
    return NextResponse.json(
      { ok: false, error: "Invalid callback token." },
      { status: 401 },
    );
  }

  let payload: XenditCallback;
  try {
    payload = (await request.json()) as XenditCallback;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const eventId = payload.id ?? payload.payment_id ?? "";
  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "Missing event id." },
      { status: 400 },
    );
  }

  const amountCents =
    typeof payload.paid_amount === "number"
      ? Math.round(payload.paid_amount * 100)
      : typeof payload.amount === "number"
        ? Math.round(payload.amount * 100)
        : undefined;

  const result = await applyGatewayEvent({
    provider: "xendit",
    eventId,
    eventType: `invoice.${(payload.status ?? "unknown").toLowerCase()}`,
    providerRef: payload.id,
    externalId: payload.external_id,
    status: gatewayStatus(payload.status),
    amountCents,
    currency: payload.currency,
    raw: payload,
  });

  return NextResponse.json({ ok: true, outcome: result.outcome });
}
