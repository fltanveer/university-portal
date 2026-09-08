import { CheckCircle2, AlertTriangle, XCircle, Clock, FileCheck2, FileX2, FileClock } from 'lucide-react';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import { stageById } from '../../data/mockData';

export function StageBadge({ stage, size = 'md', solid = false }) {
  const meta = stageById(stage);
  return (
    <Badge tone={meta.tone} size={size} solid={solid} dot>
      {meta.label}
    </Badge>
  );
}

const ELIG_ICON = { meets: CheckCircle2, borderline: AlertTriangle, not_met: XCircle };

/**
 * The eligibility pill is the densest piece of information in the list view, so
 * the exact failing requirement is one hover (or one focus) away.
 */
export function EligibilityPill({ result, size = 'md', showTooltip = true }) {
  const Icon = ELIG_ICON[result.status];
  const pill = (
    <Badge tone={result.tone} size={size} icon={Icon} className={showTooltip ? 'cursor-help' : ''}>
      {size === 'sm' ? result.label.split(' ')[0] : result.label}
    </Badge>
  );

  if (!showTooltip) return pill;

  const problems = [...result.failed, ...result.borderlineChecks];
  return (
    <Tooltip
      maxWidth={330}
      content={
        <div className="space-y-1.5">
          <p className="font-bold text-white">{result.label}</p>
          {problems.length === 0 ? (
            <p className="text-slate-300">Meets every published entry requirement for this course.</p>
          ) : (
            <ul className="space-y-1">
              {problems.map((c) => (
                <li key={c.id} className="flex items-start gap-1.5">
                  <span className={c.status === 'fail' ? 'text-rose-400' : 'text-amber-300'} aria-hidden>
                    {c.status === 'fail' ? '✕' : '!'}
                  </span>
                  <span className="text-slate-200">
                    <span className="font-semibold text-white">{c.label}</span>: has {c.actualText}, needs {c.requiredText}
                    {c.status === 'borderline' && <span className="text-amber-300"> (within tolerance)</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.checks.length > 0 && (
            <p className="pt-1 text-slate-500 border-t border-white/10">
              {result.checks.filter((c) => c.status === 'pass').length} of {result.checks.length} requirements met
            </p>
          )}
        </div>
      }
    >
      {pill}
    </Tooltip>
  );
}

const DOC_META = {
  approved: { tone: 'emerald', label: 'Approved', icon: FileCheck2 },
  rejected: { tone: 'rose', label: 'Rejected', icon: FileX2 },
  pending: { tone: 'amber', label: 'Pending review', icon: FileClock },
};

export function DocStatusBadge({ status, size = 'md' }) {
  const meta = DOC_META[status] || DOC_META.pending;
  return (
    <Badge tone={meta.tone} size={size} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

/** Days-in-stage turns amber at 5 days and rose at 10 — the SLA this team works to. */
export function AgeIndicator({ days, threshold = 5 }) {
  const tone = days >= threshold * 2 ? 'rose' : days >= threshold ? 'amber' : 'slate';
  const classes = {
    rose: 'text-rose-700 bg-rose-50 ring-rose-600/20',
    amber: 'text-amber-800 bg-amber-50 ring-amber-600/25',
    slate: 'text-slate-600 bg-slate-100 ring-slate-500/15',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-bold tabular ring-1 ring-inset ${classes}`}>
      {days >= threshold && <Clock className="h-2.5 w-2.5" aria-hidden />}
      {days}d
    </span>
  );
}

export function CountryLabel({ code, name, flag, compact = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className="text-sm leading-none">{flag}</span>
      <span className={compact ? 'sr-only' : ''}>{name}</span>
    </span>
  );
}
