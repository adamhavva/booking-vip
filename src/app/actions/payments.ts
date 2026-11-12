"use server";

import { getPaymentStatus, startPayment } from "@/lib/payments";

/**
 * The customer-facing payment actions.
 *
 * They are thin wrappers around `src/lib/payments.ts` so the browser can
 * never talk to the gateway directly.
 */

export type StartPaymentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

/** Create the gateway invoice and return the checkout URL. */
export async function startBookingPayment(params: {
  bookingCode: string;
  email: string;
  methodCode: string;
}): Promise<StartPaymentResult> {
  try {
    const result = await startPayment(params);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    console.error("[payments] could not start the payment", error);
    return {
      ok: false,
      error: "Pembayaran tidak bisa dimulai. Coba lagi sebentar.",
    };
  }
}

export type PaymentStatusResult =
  | {
      ok: true;
      status: string;
      bookingStatus: string;
      amountUsdCents: number;
      checkoutUrl: string | null;
    }
  | { ok: false; error: string };

/** The status of a booking's payment — polled by the return page. */
export async function getBookingPaymentStatus(params: {
  bookingCode: string;
  email: string;
}): Promise<PaymentStatusResult> {
  try {
    return await getPaymentStatus(params);
  } catch (error) {
    console.error("[payments] could not read the payment status", error);
    return { ok: false, error: "Status pembayaran tidak bisa dibaca." };
  }
}
