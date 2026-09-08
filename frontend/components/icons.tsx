import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const CompassIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 5-5 2 2-5 5-2z" /></svg>
);
export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const SparkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></svg>
);
export const HandsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 21c-4-2-8-5-8-9a3 3 0 015-2l3 3 3-3a3 3 0 015 2c0 4-4 7-8 9z" /></svg>
);
export const FlagIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 3v18M5 4h13l-3 4 3 4H5" /></svg>
);
export const BookIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13zM20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>
);
export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 15l6-6M10 6l1-1a4 4 0 116 6l-1 1M14 18l-1 1a4 4 0 11-6-6l1-1" /></svg>
);
export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 21s7-6.2 7-11.5A7 7 0 105 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></svg>
);
export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>
);
export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.3c2.4.4 4.5 2.4 4.5 5.7" /></svg>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></svg>
);
export const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z" /></svg>
);
export const MailIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 6.5l9 6 9-6" /></svg>
);
export const PhoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 4h4l1.5 4.5-2 1.5a12 12 0 006 6l1.5-2L20 15v4a1 1 0 01-1 1c-8.3 0-15-6.7-15-15a1 1 0 011-1z" /></svg>
);
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.6L16 9.6" /></svg>
);
export const SeatIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 14V6a2 2 0 012-2h8a2 2 0 012 2v8M4 14h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" /></svg>
);
export const LeafIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16z" /><path d="M6 20c3-5 7-9 12-12" /></svg>
);
export const MegaphoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 11v2a2 2 0 002 2h1l2 6h2l-1-6h2l8 4V5l-8 4H6a2 2 0 00-2 2z" /><path d="M11 9V5" /></svg>
);
export const HeartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 20s-7-4.4-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 5c-2.5 4.6-9.5 9-9.5 9z" /></svg>
);
export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>
);
export const ImageIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.7" /><path d="M21 16l-5.5-5.5a2 2 0 00-2.8 0L4 19" /></svg>
);
export const LogoutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 17l5-5-5-5M21 12H9" /></svg>
);
export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></svg>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" /><path d="M10 11v6M14 11v6" /></svg>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const KeyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M17 6l2 2M14 9l2 2" /></svg>
);
export const BanIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5l13 13" /></svg>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
);
export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 8.5A1.5 1.5 0 015.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" /><circle cx="12" cy="13" r="3.3" /></svg>
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V19a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H4a2 2 0 110-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H10a1.7 1.7 0 001-1.6V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V10a1.7 1.7 0 001.6 1H20a2 2 0 110 4h-.1a1.7 1.7 0 00-1.6 1z" /></svg>
);
export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5" /></svg>
);
export const CheckSquareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 12.3l2.6 2.6L16 9.5" /></svg>
);
export const ZoomIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8M8 10.5h5M10.5 8v5" /></svg>
);
export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
);
