import { useState } from 'react';
import { Search, ChevronDown, X, Check, SlidersHorizontal } from 'lucide-react';
import Dropdown from './Dropdown';
import Button from './Button';

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', width = 'w-64' }) {
  return (
    <div className={`relative ${width} ${className}`}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pl-8 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded
            text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** Multi-select filter with counts, search-within, and a clear affordance. */
export function FilterSelect({ label, options, value = [], onChange, icon: Icon, width = 260, searchable = false }) {
  const [q, setQ] = useState('');
  const active = value.length > 0;
  const shown = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;

  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <Dropdown
      width={width}
      trigger={({ toggle: t, open }) => (
        <button
          type="button"
          onClick={t}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-13 font-semibold
            transition-colors whitespace-nowrap
            ${
              active
                ? 'border-royal-300 bg-royal-50 text-royal-800 hover:bg-royal-100'
                : 'border-control bg-white text-slate-600 hover:bg-slate-50 hover:border-control-hover'
            }`}
        >
          {Icon && <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />}
          {label}
          {active && (
            <span className="ml-0.5 grid place-items-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full
              bg-royal-600 text-white text-2xs font-bold tabular">
              {value.length}
            </span>
          )}
          <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      )}
    >
      {() => (
        <div>
          {searchable && (
            <div className="p-1">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Filter ${label.toLowerCase()}…`}
                className="input h-8 text-xs"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {shown.length === 0 && <p className="px-2 py-3 text-xs text-slate-600 text-center">No matches</p>}
            {shown.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-13 text-left
                    text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span
                    className={`grid place-items-center h-3.5 w-3.5 rounded-[4px] border shrink-0 transition-colors
                      ${checked ? 'bg-royal-600 border-royal-600 text-white' : 'border-control bg-white'}`}
                    aria-hidden
                  >
                    {checked && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.count != null && <span className="text-2xs text-slate-600 font-semibold tabular">{o.count}</span>}
                </button>
              );
            })}
          </div>
          {active && (
            <div className="border-t border-slate-200 mt-1 pt-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600
                  hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </Dropdown>
  );
}

export function FilterBar({ children, activeCount = 0, onClear, className = '', right }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="hidden xl:inline-flex items-center gap-1.5 text-slate-500 pr-0.5" aria-hidden>
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </span>
      {children}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" icon={X} onClick={onClear}>
          Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
        </Button>
      )}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export default FilterBar;
