"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import { ChevronDown, SearchIcon } from "@/components/icons";
import { navLinks, searchPlaceholders, utilityLinks } from "@/data/home";
import Logo from "./Logo";

export default function Header() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % searchPlaceholders.length),
      2800
    );
    return () => clearInterval(t);
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      {/* Utility bar */}
      <div className="hidden lg:block">
        <Container className="flex items-center justify-end gap-6 py-2.5 text-[13px] font-medium text-white/90">
          {utilityLinks.map((u) => (
            <a key={u.label} href={u.href} className="hover:text-white">
              {u.label}
            </a>
          ))}
          <button className="flex items-center gap-1 hover:text-white">
            EN | IDR <ChevronDown width={14} height={14} />
          </button>
        </Container>
      </div>

      {/* Main navbar */}
      <Container className="flex items-center gap-4 pb-3 md:gap-6">
        <a href="#" aria-label="Our Vacation home">
          <Logo />
        </a>

        {/* Desktop search box */}
        <div className="relative hidden flex-1 lg:block">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width={18}
            height={18}
          />
          <input
            readOnly
            placeholder={searchPlaceholders[idx]}
            className="h-11 w-full rounded-full border border-white/0 bg-white pl-11 pr-4 text-sm text-ink shadow-sm outline-none placeholder:text-muted"
          />
        </div>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-white lg:flex">
          {navLinks.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="whitespace-nowrap hover:text-white/80"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-white/90">
            Login
          </button>
          <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            Register
          </button>
        </div>

        {/* Mobile search + actions */}
        <div className="flex flex-1 items-center gap-2 lg:hidden">
          <div className="relative flex-1">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              width={16}
              height={16}
            />
            <input
              readOnly
              placeholder={searchPlaceholders[idx]}
              className="h-9 w-full rounded-full bg-white pl-9 pr-3 text-xs text-ink outline-none placeholder:text-muted"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
            <ChevronDown width={18} height={18} />
          </button>
        </div>
      </Container>
    </header>
  );
}