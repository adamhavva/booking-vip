"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget.
 *
 * The widget is rendered explicitly (not implicitly) so it survives React's
 * re-renders, and it writes its token into the hidden
 * `cf-turnstile-response` field of the surrounding form — the form therefore
 * submits the token to the server action unchanged.
 *
 * Turnstile tokens are single-use: after a rejected submission the widget has
 * to be reset before the user can try again. Bump `resetSignal` to do that.
 */

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function TurnstileWidget({
  sitekey,
  action,
  resetSignal = 0,
}: {
  /** The public site key (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`). */
  sitekey: string;
  /** The action assigned to this surface — verified server-side. */
  action: string;
  /** Bump this to reset the widget after a failed submission. */
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  // Render the widget once the Turnstile script is available.
  useEffect(() => {
    if (!ready || !sitekey) return;
    if (widgetId.current || !containerRef.current) return;
    if (!window.turnstile) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey,
      action,
      theme: "light",
    });
  }, [ready, sitekey, action]);

  // A token is single-use — reset the widget when the caller asks for it.
  useEffect(() => {
    if (resetSignal <= 0 || !widgetId.current) return;
    window.turnstile?.reset(widgetId.current);
  }, [resetSignal]);

  // Clean up the widget when the page unmounts.
  useEffect(
    () => () => {
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    },
    [],
  );

  if (!sitekey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
        onReady={() => setReady(true)}
      />
      <div
        ref={containerRef}
        className="cf-turnstile"
        data-sitekey={sitekey}
        data-action={action}
      />
    </>
  );
}
