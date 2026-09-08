import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal-rendered so it escapes table overflow containers. Opens on hover and
 * on keyboard focus, so the eligibility detail is reachable without a mouse.
 */
export default function Tooltip({ content, children, side = 'top', className = '', maxWidth = 300 }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el || !content) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: side === 'top' ? r.top - 8 : r.bottom + 8,
      left: Math.min(Math.max(r.left + r.width / 2, maxWidth / 2 + 8), window.innerWidth - maxWidth / 2 - 8),
      side,
    });
  }, [content, side, maxWidth]);

  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      <span
        ref={ref}
        tabIndex={content ? 0 : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={`inline-flex ${className}`}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{
              top: pos.top,
              left: pos.left,
              maxWidth,
              transform: `translate(-50%, ${pos.side === 'top' ? '-100%' : '0'})`,
            }}
            className="fixed z-[100] pointer-events-none animate-fade-in"
          >
            <div className="rounded-lg bg-brand-950 px-2.5 py-2 text-xs leading-relaxed text-slate-100 shadow-pop">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
