export function Card({ className = '', children, ...props }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-xl shadow-card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, icon: Icon, className = '', children }) {
  return (
    <header className={`flex items-start justify-between gap-4 px-4 py-3 border-b border-slate-200 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />}
          <h2 className="text-sm font-bold text-slate-900 tracking-[-0.01em] truncate">{title}</h2>
        </div>
        {description && <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{description}</p>}
        {children}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return <div className={`px-4 py-3 border-t border-slate-200 bg-slate-50/60 rounded-b-xl ${className}`}>{children}</div>;
}

export default Card;
