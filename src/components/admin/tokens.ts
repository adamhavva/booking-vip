/**
 * Admin design tokens.
 *
 * The admin area is deliberately separate from the public site: white
 * background, hairline borders, near-black accents (no brand blue), and
 * `rounded-lg` (8px) instead of the site's `rounded-2xl` cards.
 *
 * Declared as CSS variables on `:root` and consumed through arbitrary values
 * (`border-[var(--admin-line)]`) so the public token set in `globals.css`
 * stays untouched.
 */

export const adminTokens = {
  line: "var(--admin-line)",
  ink: "var(--admin-ink)",
  muted: "var(--admin-muted)",
  accent: "var(--admin-accent)",
  hover: "var(--admin-hover)",
} as const;

/** Shared class strings so the tables, drawer and forms stay consistent. */
export const adminClass = {
  page: "bg-white text-[var(--admin-ink)]",
  h1: "text-[22px] font-semibold tracking-[-0.02em]",
  label: "text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]",
  body: "text-[13px]",
  panel: "rounded-lg border border-[var(--admin-line)] bg-white",
  buttonPrimary:
    "inline-flex h-9 items-center justify-center rounded-lg bg-[var(--admin-accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50",
  buttonSecondary:
    "inline-flex h-9 items-center justify-center rounded-lg border border-[var(--admin-line)] bg-white px-3 text-[13px] font-medium text-[var(--admin-ink)] transition-colors hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50",
  buttonGhost:
    "inline-flex h-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-hover)] hover:text-[var(--admin-ink)]",
  input:
    "h-9 w-full rounded-lg border border-[var(--admin-line)] bg-white px-3 text-[13px] text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-ink)] focus:ring-2 focus:ring-brand/15",
  tableHead:
    "border-b border-[var(--admin-line)] px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]",
  tableCell: "border-b border-[var(--admin-line)]/70 px-3 py-2.5 text-[13px]",
  tableRow: "border-b border-[var(--admin-line)]/70 transition-colors hover:bg-[var(--admin-hover)]",
  pill:
    "inline-flex items-center rounded-full border border-[var(--admin-line)] px-2 py-0.5 text-[11px] font-medium",
  pillOn: "border-[var(--admin-line)] bg-white text-[var(--admin-ink)]",
  pillOff: "border-[var(--admin-line)] bg-[var(--admin-hover)] text-[var(--admin-muted)]",
  drawer:
    "fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col border-l border-[var(--admin-line)] bg-white shadow-[0_8px_40px_rgba(16,24,40,0.08)]",
} as const;
