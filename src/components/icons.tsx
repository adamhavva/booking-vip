import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ fill: "currentColor", stroke: "none", ...p })}>
    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
  </svg>
);

export const SwapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 4 3 8l4 4" />
    <path d="M3 8h14" />
    <path d="m17 20 4-4-4-4" />
    <path d="M21 16H7" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
  </svg>
);

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
  </svg>
);

export const GiftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v9h14v-9" />
    <path d="M12 8a3 3 0 1 0-3-3c0 2 3 3 3 3Zm0 0a3 3 0 1 1 3-3c0 2-3 3-3 3Z" />
  </svg>
);

export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
  </svg>
);

export const ListIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export const PlaneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.3 3.6-2.1 2.1-2.4-.3a1 1 0 0 0-.9 1.6L6 18l1.4 1.9a1 1 0 0 0 1.6-.9l-.3-2.4 2.1-2.1 3.6 5.3a1 1 0 0 0 1.7-.9Z" />
  </svg>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const BoxIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </svg>
);

export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const TagIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a1.4 1.4 0 0 1 0 2Z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
);

export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const LogoutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PencilIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

export const ArrowUpIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const ArrowDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

/* ── Payment brand marks ─────────────────────────────────────────────
   Filled brand logos (not currentColor strokes), drawn as paths/shapes
   so they render identically everywhere — no fonts, no external assets. */

/** Visa — italic bold blue wordmark. */
export const VisaLogo = (p: SVGProps<SVGSVGElement>) => (
  <svg
    width={42}
    height={16}
    viewBox="0 -1 42 16"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <g
      transform="translate(3.5 0) skewX(-12)"
      stroke="#1A1F71"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="round"
    >
      <path d="M1.5 1.5 6 12.5 10.5 1.5" />
      <path d="M15 1.5v11" />
      <path d="M27 2.4c-1.1-1.1-2.6-1.7-4.1-1.7-2.2 0-3.8 1.2-3.8 3 0 3.4 7.6 2.8 7.6 6.2 0 1.9-1.8 3.1-4.1 3.1-1.8 0-3.4-.7-4.5-1.9" />
      <path d="M29 13 33.5 1 38 13M30.8 9h5.4" />
    </g>
  </svg>
);

/** Mastercard — overlapping red / yellow circles, orange intersection. */
export const MastercardLogo = (p: SVGProps<SVGSVGElement>) => (
  <svg
    width={27}
    height={20}
    viewBox="0 0 30 22"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <circle cx="9.5" cy="11" r="9" fill="#EB001B" />
    <circle cx="20.5" cy="11" r="9" fill="#F79E1B" />
    <path
      d="M15 3.88A9 9 0 0 1 15 18.12A9 9 0 0 1 15 3.88Z"
      fill="#FF5F00"
    />
  </svg>
);

/** PayPal — double-P monogram (dark blue back, light blue front). */
const payPalP =
  "M2 0H10C15 0 18 3 18 7.5C18 12 15 15 10 15H6.5V24H2ZM6.5 4V11H9.5C12 11 13.5 9.7 13.5 7.5C13.5 5.3 12 4 9.5 4Z";

export const PayPalLogo = (p: SVGProps<SVGSVGElement>) => (
  <svg
    width={17}
    height={20}
    viewBox="0 0 25 30"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <path d={payPalP} fill="#003087" fillRule="evenodd" />
    <path
      d={payPalP}
      transform="translate(5 5)"
      fill="#009CDE"
      fillRule="evenodd"
      stroke="#fff"
      strokeWidth={1.5}
      paintOrder="stroke"
    />
  </svg>
);

/** QRIS — red QR-corner glyph + bold red QRIS lettering. */
export const QrisLogo = (p: SVGProps<SVGSVGElement>) => (
  <svg
    width={54}
    height={16}
    viewBox="0 0 47 14"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <g transform="translate(0 1)" fill="#E31E25">
      <path d="M0 0H12V12H0ZM3 3V9H9V3Z" fillRule="evenodd" />
      <rect x="4.5" y="4.5" width="3" height="3" />
      <rect x="13.5" y="1.5" width="2" height="2" />
      <rect x="13.5" y="8.5" width="2" height="2" />
    </g>
    <g
      transform="translate(17 2)"
      stroke="#E31E25"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="4.7" cy="5" r="3.5" />
      <path d="M6.5 7.5 8.8 10.2" />
      <path d="M11 10V0H14.2C16.2 0 17.2 1 17.2 2.7C17.2 4.4 16.2 5.4 14.2 5.4H11M14.2 5.4 17.4 10" />
      <path d="M20.5 0V10" />
      <path d="M28 1.4C27.2 0.5 26 0 24.8 0C23 0 21.8 1 21.8 2.4C21.8 5.4 28 4.6 28 7.6C28 9.1 26.7 10 24.9 10C23.5 10 22.2 9.4 21.4 8.4" />
    </g>
  </svg>
);

/** Car — the transport category glyph of the hero rail. */
export const CarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 16v-3l1.6-4.2A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.9 1.3L20 13v3" />
    <path d="M4 13h16" />
    <circle cx="7.5" cy="16" r="1.8" />
    <circle cx="16.5" cy="16" r="1.8" />
  </svg>
);

/** Compass — the tour-package category glyph of the hero rail. */
export const CompassIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </svg>
);

/** Passport — the eVOA category glyph of the hero rail. */
export const PassportIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M9 16.5h6" />
  </svg>
);

/** Ticket — the promo strip glyph of the hero card. */
export const TicketIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z" />
    <path d="M13 5v2M13 11v2M13 17v2" />
  </svg>
);
