import { Link } from 'react-router-dom';

/**
 * Line-art tradesman seated on a structural beam, holding a hammer.
 * Outline only — no skin tone, no facial features. Temporary placeholder
 * composition that can be swapped for the final illustrated asset later.
 */
export function BenchBridgeMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="BenchBridge worker on a beam"
    >
      {/* Bridge beam on angled supports */}
      <path d="M6 47H58" strokeWidth="3.4" />
      <path d="M14 47L9 58" strokeWidth="2.4" />
      <path d="M50 47L55 58" strokeWidth="2.4" />

      {/* Far arm resting toward knee */}
      <path d="M33 35c-1 3-3 5-5 6" strokeWidth="2.1" />

      {/* Torso leaning forward */}
      <path d="M37 45c-1-5-3-9-5-12" strokeWidth="2.7" />

      {/* Head */}
      <circle cx="30" cy="29.5" r="3.4" strokeWidth="2.4" />

      {/* Hard hat: brim, dome, ridge */}
      <path d="M22.5 26.5h15" strokeWidth="2.6" />
      <path d="M24 26.5c0-6 12-6 12 0" strokeWidth="2.6" />
      <path d="M30 20.8v2.7" strokeWidth="1.9" />

      {/* Thigh up to raised knee, shin down to boot on the beam */}
      <path d="M37 45c-4-1-7-2-10-4" strokeWidth="2.7" />
      <path d="M27 41c0 3 1 4 2 5" strokeWidth="2.7" />
      <path d="M29 46h-5.5" strokeWidth="3.1" />

      {/* Near arm holding hammer */}
      <path d="M32 34c-3 3-5 6-6.5 8" strokeWidth="2.5" />
      {/* Hammer handle + head */}
      <path d="M25.5 42L19 36" strokeWidth="2.3" />
      <path d="M16.6 38.4L21.4 33.6" strokeWidth="4" />
    </svg>
  );
}

export function BenchBridgeLogo({
  to,
  large = false,
  markSize,
}: {
  to?: string;
  large?: boolean;
  markSize?: number;
}) {
  const size = markSize ?? (large ? 40 : 30);
  const content = (
    <>
      <span className="logo__word logo__bench">Bench</span>
      <span className="logo__icon" aria-hidden="true"><BenchBridgeMark size={size} /></span>
      <span className="logo__word logo__bridge">Bridge</span>
    </>
  );

  return to
    ? <Link className={`logo${large ? ' logo--lg' : ''}`} to={to} aria-label="BenchBridge home">{content}</Link>
    : <span className={`logo${large ? ' logo--lg' : ''}`} aria-label="BenchBridge">{content}</span>;
}
