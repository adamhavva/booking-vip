import type { Promo } from "@/types";

export default function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div
      className={`flex h-40 w-[320px] shrink-0 snap-start flex-col justify-end rounded-xl bg-gradient-to-br ${promo.tone} p-4 text-white`}
    >
      <h3 className="text-lg font-extrabold">{promo.title}</h3>
      <p className="text-sm opacity-90">{promo.subtitle}</p>
    </div>
  );
}