import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const WIDTHS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl', '2xl': 'max-w-5xl' };

export default function Modal({ open, onClose, title, description, size = 'md', footer, children, dismissable = true }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissable) onClose?.();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') || panelRef.current;
      target?.focus?.();
    }, 20);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 md:p-10">
      <div
        className="fixed inset-0 bg-brand-950/45 backdrop-blur-[2px] animate-fade-in"
        onClick={dismissable ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${WIDTHS[size]} bg-white rounded-xl shadow-modal animate-slide-up my-auto outline-none`}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 tracking-[-0.01em]">{title}</h2>
            {description && <p className="mt-1 text-13 text-slate-500 leading-relaxed">{description}</p>}
          </div>
          {dismissable && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 -mr-1 -mt-1 h-8 w-8 grid place-items-center rounded-lg text-slate-500
                hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </header>
        <div className="px-5 py-4 max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 rounded-b-xl">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
