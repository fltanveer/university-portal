const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  sky: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  royal: 'bg-royal-50 text-royal-700 ring-royal-600/20',
  accent: 'bg-accent-50 text-accent-700 ring-accent-600/20',
  brand: 'bg-brand-50 text-brand-800 ring-brand-700/20',
};

const DOTS = {
  slate: 'bg-slate-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
  sky: 'bg-sky-500', royal: 'bg-royal-500', accent: 'bg-accent-500', brand: 'bg-brand-700',
};

const SOLID = {
  slate: 'bg-slate-600 text-white ring-slate-700',
  emerald: 'bg-emerald-700 text-white ring-emerald-800',
  amber: 'bg-amber-500 text-amber-950 ring-amber-600',
  rose: 'bg-rose-600 text-white ring-rose-700',
  sky: 'bg-sky-600 text-white ring-sky-700',
  royal: 'bg-royal-600 text-white ring-royal-700',
  accent: 'bg-accent-600 text-white ring-accent-700',
  brand: 'bg-brand-900 text-white ring-brand-950',
};

/**
 * Status is never carried by colour alone — every badge shows a text label, and
 * callers pass an icon or dot where the distinction needs to survive a glance.
 */
export default function Badge({ tone = 'slate', solid = false, icon: Icon, dot = false, size = 'md', className = '', children, ...props }) {
  const sizing = size === 'sm' ? 'px-1.5 py-0.5 text-2xs gap-1' : 'px-2 py-0.5 text-xs gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset whitespace-nowrap
        ${sizing} ${solid ? SOLID[tone] : TONES[tone]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${solid ? 'bg-white/80' : DOTS[tone]}`} aria-hidden />}
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}

export { TONES as BADGE_TONES };
