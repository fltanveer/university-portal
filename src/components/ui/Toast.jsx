import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useStore } from '../../store/AppStore';

const TONES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', iconColor: 'text-emerald-600' },
  error: { icon: XCircle, bar: 'bg-rose-500', iconColor: 'text-rose-600' },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500', iconColor: 'text-amber-600' },
  info: { icon: Info, bar: 'bg-royal-500', iconColor: 'text-royal-600' },
};

export default function ToastHost() {
  const { toasts, dismissToast } = useStore();
  if (!toasts.length) return null;

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 w-[min(24rem,calc(100vw-2.5rem))]"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const tone = TONES[t.tone] || TONES.info;
        const Icon = tone.icon;
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="relative flex items-start gap-2.5 overflow-hidden rounded-xl border border-slate-200
              bg-white px-3.5 py-3 shadow-pop animate-slide-in-right"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden />
            <Icon className={`h-4 w-4 shrink-0 mt-px ${tone.iconColor}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-13 font-semibold text-slate-900 leading-snug">{t.message}</p>
              {t.description && <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 -mr-1 -mt-0.5 h-6 w-6 grid place-items-center rounded-md text-slate-500
                hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
