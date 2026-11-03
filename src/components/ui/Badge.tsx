import type { ReactNode } from "react";

const variants = {
  /** Red solid chip for "Best seller", "Popular", etc. */
  danger: "rounded-md bg-danger px-2 py-0.5 text-[10px] font-bold text-white",
  /** Brand blue solid chip. */
  brand: "rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold text-white",
  /** Soft brand chip used on eVOA cards. */
  soft: "rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand",
  /** Light chip used for tour durations. */
  light: "rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink",
  /** Compact red pill used in the header category rail. */
  pill: "rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white",
} as const;

export type BadgeVariant = keyof typeof variants;

export default function Badge({
  variant = "danger",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${variants[variant]} ${className}`}>{children}</span>
  );
}