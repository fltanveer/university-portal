import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-4' : 'py-16 px-6'} ${className}`}>
      <span className="grid place-items-center h-11 w-11 rounded-xl bg-slate-100 text-slate-500 mb-3.5" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-13 text-slate-500 leading-relaxed text-pretty">{description}</p>}
      {action && <div className="mt-4 flex items-center gap-2">{action}</div>}
    </div>
  );
}
