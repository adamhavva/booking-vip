"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/layout/Logo";
import { footerColumns, socials } from "@/data/home";
import { serviceNav } from "@/data/services";
import { useLocale } from "@/components/providers/LocaleProvider";
import { SERVICE_LABEL_KEYS } from "@/lib/serviceLabels";
import type { DictKey } from "@/i18n";
import { VisaLogo, MastercardLogo, PayPalLogo, QrisLogo } from "@/components/icons";

/** Label → route, so the Services column links to the service sub-pages. */
const serviceRoutes = Object.fromEntries(
  serviceNav.map((s) => [s.label, s.href])
);

/** Column heading → dictionary key. */
const HEADING_KEYS: Record<string, DictKey> = {
  Services: "footer.services",
  Company: "footer.company",
  Support: "footer.support",
};

/** Column item → dictionary key. Service names reuse the nav keys; eVOA is a brand term. */
const ITEM_KEYS: Record<string, DictKey> = {
  ...SERVICE_LABEL_KEYS,
  "About Us": "footer.aboutUs",
  "How It Works": "footer.howItWorks",
  Careers: "footer.careers",
  Partners: "footer.partners",
  Contact: "footer.contact",
  "Help Center": "footer.helpCenter",
  FAQ: "footer.faq",
  "Privacy Policy": "footer.privacyPolicy",
  "Terms & Conditions": "footer.terms",
  "Refund Policy": "footer.refundPolicy",
};

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-[#0b1b2b] text-white/80">
      <Container className="py-12">
        {/* Top: logo + contact */}
        <div className="mb-10 grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-white/60">{t("footer.chatLabel")}</span> {t("footer.chat")}
              </p>
              <p>
                <span className="text-white/60">{t("footer.emailLabel")}</span> cs@example.com
              </p>
              <p>
                <span className="text-white/60">{t("footer.callCenter")}</span>
                <br />
                +62 000 0000 000
              </p>
            </div>
          </div>

          {Object.entries(footerColumns).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="mb-3 text-sm font-bold text-white">
                {HEADING_KEYS[heading] ? t(HEADING_KEYS[heading]) : heading}
              </h3>
              <ul className="space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i}>
                    <Link href={serviceRoutes[i] ?? "#"} className="hover:text-white">
                      {ITEM_KEYS[i] ? t(ITEM_KEYS[i]) : i}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Lower: partner / secure / awards / social */}
        <div className="grid gap-8 border-t border-white/10 pt-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">{t("footer.partner")}</h3>
            <div className="flex items-center gap-3">
              <span className="h-10 w-16 rounded bg-white/10" />
              <p className="text-xs text-white/60">
                {t("footer.partnerDesc")}
              </p>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">
              {t("footer.secure")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Visa", VisaLogo],
                  ["Mastercard", MastercardLogo],
                  ["PayPal", PayPalLogo],
                  ["QRIS", QrisLogo],
                ] as const
              ).map(([label, LogoMark]) => (
                <span
                  key={label}
                  aria-label={label}
                  className="inline-flex h-8 items-center rounded-md bg-white px-2"
                >
                  <LogoMark aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">{t("footer.awards")}</h3>
            <div className="flex gap-2">
              {["IATA", "Top Brand", "Superbrands"].map((a) => (
                <span
                  key={a}
                  className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/70"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">{t("footer.followUs")}</h3>
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] hover:bg-white/20"
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          {t("footer.copyright")}
        </p>
      </Container>
    </footer>
  );
}