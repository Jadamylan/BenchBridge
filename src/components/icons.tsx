import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const HelmetIcon = (p: IconProps) => (
  <Base {...p}><path d="M3 15h18" /><path d="M5.5 15a6.5 6.5 0 0 1 13 0" /><path d="M12 8.5V15" /><path d="M9 9.2A6.4 6.4 0 0 1 12 8.5c1.1 0 2.1.3 3 .7" /></Base>
);

export const BoltIcon = (p: IconProps) => (
  <Base {...p}><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" /></Base>
);

export const TruckIcon = (p: IconProps) => (
  <Base {...p}><path d="M1.5 6.5h11v9h-11z" /><path d="M12.5 10h3.8l3.2 3.2v2.3h-7z" /><circle cx="5.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></Base>
);

export const PinIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 21.5s7-6.4 7-11.2a7 7 0 1 0-14 0C5 15.1 12 21.5 12 21.5z" /><circle cx="12" cy="10" r="2.6" /></Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 2.8 19.5 5.6v6c0 4.8-3.3 7.7-7.5 9.1-4.2-1.4-7.5-4.3-7.5-9.1v-6z" /><path d="M8.8 12.1 11 14.3l4.2-4.6" /></Base>
);

export const WrenchIcon = (p: IconProps) => (
  <Base {...p}><path d="M15.6 3.2a5.2 5.2 0 0 0-4.5 7.7L3.5 18.5 5.6 20.6l7.6-7.6a5.2 5.2 0 1 0 2.4-9.8z" /><path d="M15.6 3.2 18 5.6" /></Base>
);

export const GearIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="3.3" /><path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" /></Base>
);

export const TargetIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1" /></Base>
);

export const CheckCircleIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.3 10.8 15 16 9.4" /></Base>
);

export const ClipboardIcon = (p: IconProps) => (
  <Base {...p}><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" /></Base>
);
