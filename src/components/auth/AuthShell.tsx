import type { ReactNode } from "react";

/**
 * The split layout used by the customer login and register pages.
 *
 * Left: a brand panel with the product story (hidden on small screens).
 * Right: the form itself, centred on a white canvas. Deliberately without
 * the site header/footer — these pages are a focused, distraction-free step.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <aside className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b2a4a] via-[#103a63] to-[#0a4da0] p-12 lg:flex">
        <Decor />

        <BrandMark />

        <div className="relative max-w-[440px]">
          <h2 className="text-[44px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white">
            Travel in style,
            <br />
            <span className="text-[#7fb2ff]">every time.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70">
            Airport VIP, private transport, tour packages and eVOA — one
            booking, one account.
          </p>

          <ul className="mt-9 space-y-3">
            {[
              "Priority meet & greet diterminal",
              "Jadwal perjalanan tersinkron otomatis",
              "Promo khusus member Booking VIP",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-white/85">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/50">
          © Booking VIP. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%]">
        <div className="w-full max-w-[400px]">
          {/* Brand mark for small screens (the panel is hidden there). */}
          <div className="mb-8 lg:hidden">
            <BrandMark dark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Soft blurred shapes that give the brand panel some depth. */
function Decor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#7fb2ff]/20 blur-3xl" />
    </div>
  );
}

/** The Booking VIP wordmark. */
function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`relative inline-flex items-center gap-2.5 text-[18px] font-extrabold tracking-tight ${
        dark ? "text-ink" : "text-white"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          dark ? "bg-brand text-white" : "bg-white/15 text-white"
        }`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z"
          />
        </svg>
      </span>
      Booking VIP
    </span>
  );
}
