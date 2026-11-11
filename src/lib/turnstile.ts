import "server-only";

/**
 * Cloudflare Turnstile — server-side verification.
 *
 * The browser only ever renders the widget; the token it produces is
 * redeemed here, against Cloudflare's Siteverify endpoint, before the real
 * handler (sign-in / sign-up) runs. The secret never leaves the server.
 *
 * Contract (canonical Turnstile flow):
 *   1. the token must be present and well-formed,
 *   2. Siteverify must answer `success: true`,
 *   3. the `action` must be the one assigned to that surface,
 *   4. the `hostname` must be an approved frontend hostname.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The longest token Turnstile ever issues. */
const MAX_TOKEN_LENGTH = 2048;

/**
 * The frontend hostnames this deployment accepts, read from
 * `TURNSTILE_HOSTNAMES` (comma-separated). A production deployment must list
 * its real domain — `localhost` must never be part of a production list.
 */
function allowedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
}

/** The public site key — safe to hand to the browser. */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

/**
 * Verify a `cf-turnstile-response` token for one surface.
 *
 * Returns `true` only when the token is valid, was issued for `action`, and
 * was solved on an approved hostname. Any failure (missing token, network
 * error, invalid answer) returns `false` — the caller turns that into a
 * generic error message so nothing about the token leaks to the browser.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  expectedAction: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error(
      "[turnstile] TURNSTILE_SECRET is not configured — rejecting the request",
    );
    return false;
  }

  if (typeof token !== "string" || token.length === 0) return false;
  if (token.length > MAX_TOKEN_LENGTH) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let result: {
    success?: boolean;
    hostname?: string;
    action?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[turnstile] siteverify answered ${res.status}`);
      return false;
    }
    result = await res.json();
  } catch (error) {
    console.error("[turnstile] siteverify request failed", error);
    return false;
  }

  if (!result.success) {
    console.error("[turnstile] siteverify rejected the token", result["error-codes"]);
    return false;
  }

  if (result.action !== expectedAction) {
    console.error("[turnstile] unexpected action", result.action);
    return false;
  }

  const hostnames = allowedHostnames();
  if (hostnames.size > 0) {
    if (!result.hostname || !hostnames.has(result.hostname)) {
      console.error("[turnstile] unexpected hostname", result.hostname);
      return false;
    }
  } else {
    console.warn(
      "[turnstile] TURNSTILE_HOSTNAMES is empty — every hostname is accepted. Set it before going live.",
    );
  }

  return true;
}
