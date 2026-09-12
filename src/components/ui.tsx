export function ProgressBar({ step, total, label }: { step: number; total: number; label: string }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="progress-bar">
      <div className="progress-bar__top">
        <span className="progress-bar__count">Step {step + 1} of {total}</span>
        <span className="progress-bar__label">{label}</span>
      </div>
      <div className="progress-bar__track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total} aria-label="Intake progress">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StepHeader({ title, hint, why }: { title: string; hint?: string; why?: string }) {
  return (
    <div className="step-header">
      <h2>{title}</h2>
      {hint && <p>{hint}</p>}
      {why && <p className="muted">{why}</p>}
    </div>
  );
}

export function SelectionCard({
  name,
  type = 'radio',
  title,
  detail,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  type?: 'radio' | 'checkbox';
  title: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`selection-card${checked ? ' selection-card--selected' : ''}`}>
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} />
      <span><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
    </label>
  );
}

export function SelectionChip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`selection-chip${selected ? ' selection-chip--selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      {selected && <span className="selection-chip__mark" aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}

export function matchStrength(score: number): { label: string; className: string } {
  if (score >= 85) return { label: 'Strong match', className: 'match-strength--strong' };
  if (score >= 70) return { label: 'Good match', className: 'match-strength--good' };
  return { label: 'Possible match', className: 'match-strength--possible' };
}

export function MatchStrengthBadge({ score }: { score: number }) {
  const strength = matchStrength(score);
  return <span className={`match-strength ${strength.className}`}>{strength.label}</span>;
}

export function MatchReasons({ reasons }: { reasons: string[] }) {
  return (
    <ul className="match-reasons">
      {reasons.map((reason) => (
        <li className="match-reason" key={reason}>
          <span className="match-reason__check" aria-hidden="true">✓</span>
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

export interface RelationshipStep {
  label: string;
  kind?: 'you' | 'target';
  link?: string;
}

export function RelationshipPath({ steps, caption }: { steps: RelationshipStep[]; caption?: string }) {
  return (
    <div>
      {caption && <p className="eyebrow">{caption}</p>}
      <div className="relationship-path">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`}>
            {index > 0 && <div className="relationship-link">{step.link ?? 'connects to'}</div>}
            <div className={`relationship-node${step.kind === 'you' ? ' relationship-node--you' : ''}${step.kind === 'target' ? ' relationship-node--target' : ''}`}>
              <span className="relationship-node__dot" aria-hidden="true">{index + 1}</span>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingMatchState({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <section className="loading-match" aria-live="polite">
      <div className="loading-match__spinner" aria-hidden="true" />
      <h2>Finding your strongest matches</h2>
      <div className="loading-match__steps">
        {steps.map((step, index) => {
          const state = index < activeIndex ? ' loading-match__step--done' : index === activeIndex ? ' loading-match__step--active' : '';
          return (
            <div className={`loading-match__step${state}`} key={step}>
              <span className="match-reason__check" aria-hidden="true">{index < activeIndex ? '✓' : ''}</span>
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
