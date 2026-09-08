const TONES = {
  royal: 'bg-royal-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
  rose: 'bg-rose-600',
  accent: 'bg-accent-600',
  brand: 'bg-brand-800',
};

export default function Progress({ value = 0, max = 100, tone = 'royal', size = 'md', label, className = '', showValue }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  // Consumption bars turn amber then rose as they approach the cap.
  const autoTone = tone === 'auto' ? (pct >= 100 ? 'rose' : pct >= 80 ? 'amber' : 'emerald') : tone;
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 mb-1">
          {label && <span className="text-2xs font-semibold text-slate-600">{label}</span>}
          {showValue && <span className="text-2xs font-bold text-slate-700 tabular">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 ${size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5'}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${TONES[autoTone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
