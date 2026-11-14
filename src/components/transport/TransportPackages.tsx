"use client";

import { Car, Gift, Info, X } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TransportPackageDTO } from "@/app/actions/transport";

/**
 * "Pilih Paket Sewa Mobilmu" — the selectable rental packages.
 *
 * The selected card gets the blue border and the pointer notch; the package
 * with the biggest promo cut carries the "Paling untung" badge. The pink
 * banner below lists the selected package's excluded costs — the ones the
 * customer pays to the vendor directly.
 */
export default function TransportPackages({
  packages,
  selectedId,
  onSelect,
  formatMoney,
}: {
  packages: TransportPackageDTO[];
  selectedId: string;
  onSelect: (id: string) => void;
  formatMoney: (usd: number) => string;
}) {
  const { t } = useLocale();

  if (packages.length === 0) return null;

  // The best value = the biggest percent cut among the promo packages.
  let bestId: string | null = null;
  let bestPercent = 0;
  for (const pkg of packages) {
    if (pkg.fromUsdCents != null && pkg.fromUsdCents > pkg.unitUsdCents) {
      const percent = ((pkg.fromUsdCents - pkg.unitUsdCents) / pkg.fromUsdCents) * 100;
      if (percent > bestPercent) {
        bestPercent = percent;
        bestId = pkg.id;
      }
    }
  }

  const selected = packages.find((pkg) => pkg.id === selectedId) ?? packages[0]!;
  const excluded = selected.info.filter((entry) => entry.excluded);

  return (
    <section>
      <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.01em] text-ink">
        {t("transport.packagesHeading")}
        <Info width={16} height={16} className="text-brand" />
      </h2>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-6">
        {packages.map((pkg, index) => {
          const active = pkg.id === selected.id;
          const hasPromo = pkg.fromUsdCents != null && pkg.fromUsdCents > pkg.unitUsdCents;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              aria-pressed={active}
              className={`relative w-full rounded-xl border-2 p-4 text-left transition-colors sm:w-56 ${
                active
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-white hover:border-brand/40"
              }`}
            >
              {bestId === pkg.id ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-danger px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {t("transport.bestValue")}
                </span>
              ) : null}

              {index === 0 ? (
                <Car width={22} height={22} className="text-brand" />
              ) : (
                <Gift width={22} height={22} className="text-brand" />
              )}
              <p className="mt-2 text-[14px] font-bold text-ink">{pkg.label}</p>
              {pkg.description ? (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                  {pkg.description}
                </p>
              ) : null}

              <div className="mt-3">
                {hasPromo ? (
                  <p className="text-[11px] text-muted line-through">
                    {formatMoney(pkg.fromUsdCents! / 100)}
                    {t("transport.perDay")}
                  </p>
                ) : null}
                <p
                  className={`text-[15px] font-extrabold ${
                    hasPromo ? "text-danger" : "text-ink"
                  }`}
                >
                  {formatMoney(pkg.unitUsdCents / 100)}
                  <span className="text-[11px] font-medium text-muted">
                    {t("transport.perDay")}
                  </span>
                </p>
              </div>

              {/* The pointer notch under the selected card. */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-brand bg-brand-soft"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Excluded costs — paid to the vendor / driver directly. */}
      {excluded.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-danger/15 shadow-sm">
          <p className="bg-danger/10 px-4 py-2.5 text-[12px] text-ink">
            {t("transport.excludedIntro")}
          </p>
          <ul className="space-y-3 bg-white px-4 py-4">
            {excluded.map((entry) => (
              <li key={entry.key} className="flex items-start gap-3 text-[13px] text-ink">
                <X width={16} height={16} className="mt-0.5 shrink-0 text-danger" />
                <span>{entry.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

