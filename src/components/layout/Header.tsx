"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { UserIcon } from "@/components/icons";
import { utilityLinks } from "@/data/home";
import Logo from "./Logo";
import NavBar from "./NavBar";
import LocaleMenu from "./LocaleMenu";
import UserMenu from "./UserMenu";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Site header: utility bar + brand row, followed by the {@link NavBar}.
 * `overlay` sits transparently on top of the home hero and turns into a
 * solid white bar once the page is scrolled; `solid` is always a sticky
 * white bar (used on the service sub-pages).
 */
export default function Header({
  variant = "overlay",
}: {
  variant?: "overlay" | "solid";
}) {
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const solid = variant === "solid" || scrolled;

  return (
    <header
      className={`z-30 ${
        variant === "solid"
          ? "sticky top-0 border-b border-line bg-white"
          : scrolled
            ? "fixed inset-x-0 top-0 border-b border-line bg-white shadow-sm"
            : "absolute inset-x-0 top-0"
      }`}
    >
      {/* Utility bar */}
      <div className="hidden lg:block">
        <Container
          className={`flex items-center justify-end gap-6 py-2.5 text-[13px] font-medium ${
            solid ? "text-muted" : "text-white/90"
          }`}
        >
          {utilityLinks.map((u) => (
            <Link
              key={u.label}
              href={u.href}
              className={solid ? "hover:text-ink" : "hover:text-white"}
            >
              {u.label}
            </Link>
          ))}
          <LocaleMenu variant={solid ? "solid" : "overlay"} />
        </Container>
      </div>

      {/* Brand row */}
      <Container className="flex items-center gap-4 pb-3 md:gap-6">
        <Link href="/" aria-label={t("header.ourVacationHome")}>
          <Logo dark={solid} />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3">
          <UserMenu solid={solid} />
          <div className="text-xs lg:hidden">
            <LocaleMenu variant={solid ? "solid" : "overlay"} />
          </div>
          <button
            aria-label={t("nav.account")}
            className={`flex h-9 w-9 items-center justify-center rounded-full lg:hidden ${
              solid ? "bg-canvas text-ink" : "bg-white/20 text-white"
            }`}
          >
            <UserIcon width={18} height={18} />
          </button>
        </div>
      </Container>

      <NavBar variant={solid ? "solid" : "overlay"} />
    </header>
  );
}
