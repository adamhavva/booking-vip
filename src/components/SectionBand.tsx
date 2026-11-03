"use client";

import { useState, type ReactNode } from "react";

export default function SectionBand({
  title,
  eyebrow,
  emoji,
  tabs,
  seeAll = "See all",
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  emoji?: string;
  tabs?: string[];
  seeAll?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <section className={`mx-auto max-w-[1200px] px-6 py-6 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl font-extrabold text-ink md:text-2xl">
            {title} {emoji}
          </h2>
        </div>
        {seeAll && (
          <a
            href="#"
            className="hidden shrink-0 text-sm font-semibold text-brand hover:underline md:block"
          >
            {seeAll}
          </a>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active === i
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-white text-ink hover:border-brand/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {children}
    </section>
  );
}
