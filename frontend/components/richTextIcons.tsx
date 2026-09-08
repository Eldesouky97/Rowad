import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const BoldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4h6a3.5 3.5 0 010 7H7z" /><path d="M7 11h7a3.5 3.5 0 010 7H7z" /></svg>
);
export const ItalicIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M11 4h6M5 20h6M14 4l-4 16" /></svg>
);
export const UnderlineIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 4v7a6 6 0 0012 0V4M4 20h16" /></svg>
);
export const StrikeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 12h14M7 7c0-1.8 2.2-3 5-3s5 1.2 5 3c0 1-.6 1.8-1.8 2.4M17 17c0 1.8-2.2 3-5 3s-5-1.2-5-3c0-1 .6-1.8 1.8-2.4" /></svg>
);
export const QuoteIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 8a3 3 0 00-3 3v2a3 3 0 003 3M17 8a3 3 0 00-3 3v2a3 3 0 003 3" /></svg>
);
export const ListIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /><path d="M9 6h11M9 12h11M9 18h11" /></svg>
);
export const ListOrderedIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 5v3M4 5l-1 1M4 11v3M3 11h2v3H3M4 17v3h1.5" /></svg>
);
export const AlignRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 6h16M10 12h10M4 18h16" /></svg>
);
export const AlignCenterIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 6h16M7 12h10M4 18h16" /></svg>
);
export const AlignLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h10M4 18h16" /></svg>
);
export const AlignJustifyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const UndoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 7L4 11l4 4" /><path d="M4 11h10a5 5 0 010 10h-2" /></svg>
);
export const RedoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M16 7l4 4-4 4" /><path d="M20 11H10a5 5 0 000 10h2" /></svg>
);
export const EraserIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M16 3l5 5-9.5 9.5H6L3 14.5z" /><path d="M9 20h11" /></svg>
);
