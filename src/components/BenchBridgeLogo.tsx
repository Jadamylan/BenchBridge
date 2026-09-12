import { Link } from 'react-router-dom';

/**
 * Final brand mark: line-art tradesman seated on a structural beam, holding a
 * hammer. Outline only — no skin tone, no facial features.
 */
export function BenchBridgeMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <img
      className={className}
      src="/brand/benchbridge-mark.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
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
