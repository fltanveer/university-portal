import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ACCENTS = {
  royal: 'text-royal-600 bg-royal-50',
  accent: 'text-accent-600 bg-accent-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  amber: 'text-amber-600 bg-amber-50',
  brand: 'text-brand-800 bg-brand-50',
  rose: 'text-rose-600 bg-rose-50',
};

/**
 * `sentiment` says what a rise means for this particular metric. A growing
 * backlog is not a win, so those tiles pass 'neutral' and get no green.
 */
export default function StatCard({
  label, value, change, changeLabel = 'vs last month', icon: Icon, tone = 'royal',
  onClick, hint, sentiment = 'higher-is-better',
}) {
  const dir = change == null ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const good = sentiment === 'higher-is-better' ? dir === 'up' : sentiment === 'lower-is-better' ? dir === 'down' : null;
  const trendClass =
    good === null || dir === 'flat'
      ? 'text-slate-600 bg-slate-100'
      : good
        ? 'text-emerald-700 bg-emerald-50'
        : 'text-rose-700 bg-rose-50';

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative flex flex-col gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left
        shadow-card transition-shadow ${onClick ? 'hover:shadow-pop hover:border-slate-300 cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="micro-label leading-tight">{label}</p>
        {Icon && (
          <span className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${ACCENTS[tone]}`} aria-hidden>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="font-display text-4xl leading-none text-brand-950 tabular">{value}</span>
        {change != null && (
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-bold tabular ${trendClass}`}>
            <TrendIcon className="h-3 w-3" aria-hidden />
            {change > 0 ? '+' : ''}
            {change}%
            <span className="sr-only">
              {' '}
              {dir === 'up' ? 'increase' : dir === 'down' ? 'decrease' : 'no change'} {changeLabel}
            </span>
          </span>
        )}
      </div>
      <p className="text-2xs text-slate-600 font-medium -mt-1">{hint || changeLabel}</p>
    </Tag>
  );
}
