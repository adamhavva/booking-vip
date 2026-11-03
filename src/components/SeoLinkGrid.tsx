"use client";

import { useState } from "react";

export default function SeoLinkGrid({
  title,
  tabs,
  links,
}: {
  title: string;
  tabs: string[];
  links: string[];
}) {
  const [active, setActive] = useState(0);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-8">
      <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
        {title}
      </h2>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActive(i)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === i
                ? "bg-brand text-white"
                : "bg-canvas text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-4">
        {links.map((l) => (
          <a
            key={l}
            href="#"
            className="text-sm text-muted hover:text-brand hover:underline"
          >
            {l}
          </a>
        ))}
      </div>
    </section>
  );
}
