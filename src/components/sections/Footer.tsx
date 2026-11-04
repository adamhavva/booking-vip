"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/layout/Logo";
import { footerColumns, socials } from "@/data/home";
import { serviceNav } from "@/data/services";
import { useLocale } from "@/components/providers/LocaleProvider";

/** Label → route, so the Services column links to the service sub-pages. */
const serviceRoutes = Object.fromEntries(
  serviceNav.map((s) => [s.label, s.href])
);

function AppBadge({ store, downloadLabel }: { store: string; downloadLabel: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-left">
      <span className="h-6 w-6 rounded bg-gradient-to-br from-slate-300 to-slate-500" />
      <span className="text-xs leading-tight text-white/80">
        {downloadLabel}
        <br />
        <span className="font-semibold text-white">{store}</span>
      </span>
    </div>
  );
}

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-[#0b1b2b] text-white/80">
      <Container className="py-12">
        {/* Top: logo + contact */}
        <div className="mb-10 grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <Logo />
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-white/60">Chat:</span> {t("footer.chat")}
              </p>
              <p>
                <span className="text-white/60">Email:</span> cs@example.com
              </p>
              <p>
                <span className="text-white/60">Call Center:</span>
                <br />
                +62 000 0000 000
              </p>
            </div>
          </div>

          {Object.entries(footerColumns).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="mb-3 text-sm font-bold text-white">{heading}</h3>
              <ul className="space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i}>
                    <Link href={serviceRoutes[i] ?? "#"} className="hover:text-white">
                      {i}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3 text-sm font-bold text-white">
              {t("footer.cheaperOnApp")}
            </h3>
            <div className="flex flex-col gap-2">
              <AppBadge store="App Store" downloadLabel={t("footer.downloadOn")} />
              <AppBadge store="Google Play" downloadLabel={t("footer.downloadOn")} />
            </div>
          </div>
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
              {["Visa", "Mastercard", "JCB", "Amex"].map((s) => (
                <span
                  key={s}
                  className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/70"
                >
                  {s}
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