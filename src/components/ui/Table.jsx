import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

export function TableWrap({ className = '', children }) {
  return (
    <div className={`overflow-x-auto scrollbar-thin ${className}`}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function SortHeader({ label, field, sort, onSort, align = 'left', className = '' }) {
  const active = sort?.field === field;
  const dir = sort?.dir;
  const Icon = !active ? ChevronsUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={`th ${align === 'right' ? 'text-right' : ''} ${className}`}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 rounded transition-colors
          ${align === 'right' ? 'flex-row-reverse' : ''}
          ${active ? 'text-brand-900' : 'hover:text-slate-700'}`}
      >
        {label}
        <Icon className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-35'}`} aria-hidden />
      </button>
    </th>
  );
}

export function Checkbox({ checked, indeterminate, onChange, label, className = '', ...props }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      aria-label={label}
      ref={(el) => el && (el.indeterminate = !!indeterminate && !checked)}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className={`h-3.5 w-3.5 rounded-[4px] border-control text-royal-600 cursor-pointer
        focus:ring-2 focus:ring-royal-600/30 focus:ring-offset-0 transition-colors ${className}`}
      {...props}
    />
  );
}

export default TableWrap;
