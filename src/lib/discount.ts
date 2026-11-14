/**
 * Stacked discount ("diskon akumulasi") math — pure helpers, no database.
 *
 * The one rule that matters: discounts are **averaged, never summed**.
 * A campaign with a 50% product and a 60% product displays
 * `(50 + 60) / 2 = 55%` — never `110%`.
 *
 * Both the server actions (`src/app/actions/promo.ts`) and the admin live
 * preview call these helpers, so the number an operator sees while picking
 * products is exactly the number the public reader returns. No percent is
 * ever stored — it is recomputed from the price cents on every read.
 */

/** The price fields of one package that decide the product's net price. */
export type PackagePriceInput = {
  /** "per_pax" | "per_unit" */
  unitKind: string;
  adultUsdCents: number | null;
  unitUsdCents: number | null;
  /** Inactive packages never set the net price. Defaults to active. */
  active?: boolean;
};

/**
 * The net (selling) price of a product: the cheapest active package.
 *
 * `per_unit` packages sell at `unitUsdCents`; `per_pax` packages sell at the
 * adult price (falling back to the unit price). Returns `null` when no
 * package carries a usable price.
 */
export function netPriceFromPackages(
  packages: PackagePriceInput[],
): number | null {
  let net: number | null = null;
  for (const pkg of packages) {
    if (pkg.active === false) continue;
    const price =
      pkg.unitKind === "per_unit"
        ? pkg.unitUsdCents
        : (pkg.adultUsdCents ?? pkg.unitUsdCents);
    if (price == null || !Number.isFinite(price) || price < 0) continue;
    net = net == null ? price : Math.min(net, price);
  }
  return net;
}

/**
 * The discount of one product, in whole percent.
 *
 * `round((from - net) / from * 100)` — and `0` whenever the "from" price is
 * missing, non-positive, or not above the net price (no discount to show).
 */
export function productDiscountPercent(
  fromUsdCents: number | null | undefined,
  netUsdCents: number | null | undefined,
): number {
  if (fromUsdCents == null || netUsdCents == null) return 0;
  if (!Number.isFinite(fromUsdCents) || !Number.isFinite(netUsdCents)) return 0;
  if (fromUsdCents <= 0 || fromUsdCents <= netUsdCents) return 0;
  return Math.round(((fromUsdCents - netUsdCents) / fromUsdCents) * 100);
}

/**
 * The campaign percent: the **average** of the member percents, rounded.
 * An empty list is `0` — an empty campaign is excluded by the readers.
 */
export function averageDiscountPercent(percents: number[]): number {
  if (percents.length === 0) return 0;
  const sum = percents.reduce((total, percent) => total + percent, 0);
  return Math.round(sum / percents.length);
}

/** One campaign member's price snapshot — enough to compute its percent. */
export type DiscountPriceInput = {
  fromUsdCents: number | null | undefined;
  netUsdCents: number | null | undefined;
};

/**
 * The stacked discount of a set of products: the average of their individual
 * percents. This is the helper the admin live preview and the server readers
 * share, so they can never disagree.
 */
export function stackedDiscountPercent(products: DiscountPriceInput[]): number {
  return averageDiscountPercent(
    products.map((p) => productDiscountPercent(p.fromUsdCents, p.netUsdCents)),
  );
}