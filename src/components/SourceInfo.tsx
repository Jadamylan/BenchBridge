import type { Source } from '../domain/types';

export function formatDate(value: string): string {
  if (!value || value === 'not provided' || value === 'not listed') return value || 'Not provided';
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(`${value}T00:00:00`),
    );
  }
  return value;
}

export function SourceInfo({ source, verifiedAsOf }: { source: Source; verifiedAsOf: string }) {
  return (
    <div className="source-info">
      <span>Source: {source.name}</span>
      <span>Verified: {formatDate(verifiedAsOf)}</span>
    </div>
  );
}
