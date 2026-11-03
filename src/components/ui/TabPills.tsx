"use client";

const pillStyles = {
  /** Outlined pills used inside section bands. */
  bordered: {
    base: "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
    active: "border-brand bg-brand-soft text-brand",
    idle: "border-line bg-white text-ink hover:border-brand/40",
  },
  /** Solid pills used above SEO link grids. */
  filled: {
    base: "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
    active: "bg-brand text-white",
    idle: "bg-canvas text-muted hover:text-ink",
  },
} as const;

export type TabPillsVariant = keyof typeof pillStyles;

/**
 * Horizontal, scrollable tab rail shared by SectionBand and SeoLinkGrid.
 * Spacing/borders are supplied per usage via `className`.
 */
export default function TabPills({
  items,
  active,
  onChange,
  variant = "bordered",
  className = "",
}: {
  items: string[];
  active: number;
  onChange: (index: number) => void;
  variant?: TabPillsVariant;
  className?: string;
}) {
  const styles = pillStyles[variant];

  return (
    <div className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>
      {items.map((item, index) => (
        <button
          key={item}
          onClick={() => onChange(index)}
          className={`whitespace-nowrap ${styles.base} ${
            active === index ? styles.active : styles.idle
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}