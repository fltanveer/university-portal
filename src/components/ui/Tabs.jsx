/**
 * Underlined tabs for local navigation inside a section. The active state uses
 * weight + an indicator bar as well as colour.
 */
export default function Tabs({ tabs, active, onChange, className = '', size = 'md' }) {
  return (
    <div className={`flex items-center gap-0.5 border-b border-slate-200 overflow-x-auto scrollbar-thin ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap font-semibold
              transition-colors -mb-px border-b-2
              ${size === 'sm' ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-13'}
              ${
                isActive
                  ? 'border-royal-600 text-brand-900'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
              }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
            {tab.label}
            {tab.count != null && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-px text-2xs font-bold tabular
                  ${isActive ? 'bg-royal-100 text-royal-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
