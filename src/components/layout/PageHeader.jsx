import { ChevronRight } from 'lucide-react';
import { Link } from '../../lib/router';

export default function PageHeader({ title, description, breadcrumbs = [], actions, meta, className = '', size = 'md' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-xs font-semibold text-slate-600 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <li key={`${b.label}-${i}`} className="flex items-center gap-1 min-w-0">
                {b.to ? (
                  <Link to={b.to} className="hover:text-royal-700 transition-colors truncate">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 truncate">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" aria-hidden />}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className={`display-title ${size === 'lg' ? 'text-3xl' : 'text-2xl'} leading-none`}>{title}</h1>
          {description && <p className="mt-2 text-13 text-slate-500 leading-relaxed max-w-2xl text-pretty">{description}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
