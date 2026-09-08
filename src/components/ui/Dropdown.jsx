import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Anchored popover used by menus, filters and pickers. Portal-rendered so it is
 * never clipped by a scrolling table, and it flips upward near the viewport
 * bottom.
 */
export default function Dropdown({ trigger, children, align = 'left', width = 240, className = '', onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const anchorRef = useRef(null);
  const popRef = useRef(null);

  const place = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < 280 && r.top > 300;
    const left = align === 'right' ? Math.max(8, r.right - width) : Math.min(r.left, window.innerWidth - width - 8);
    setStyle({
      left,
      top: flip ? undefined : r.bottom + 6,
      bottom: flip ? window.innerHeight - r.top + 6 : undefined,
      transformOrigin: flip ? 'bottom center' : 'top center',
      width,
      maxHeight: flip ? r.top - 20 : spaceBelow - 20,
    });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    onOpenChange?.(open);
    if (!open) return;
    const onDoc = (e) => {
      if (!popRef.current?.contains(e.target) && !anchorRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onScroll = () => place();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <span ref={anchorRef} className={`inline-flex ${className}`}>
        {typeof trigger === 'function' ? trigger({ open, toggle: () => setOpen((o) => !o) }) : (
          <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
        )}
      </span>
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={style}
            className="fixed z-[80] overflow-y-auto scrollbar-thin rounded-xl border border-slate-200
              bg-white p-1 shadow-pop animate-pop-in"
          >
            {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
          </div>,
          document.body
        )}
    </>
  );
}

export function MenuItem({ icon: Icon, children, onClick, tone = 'default', disabled, shortcut, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-13 font-medium text-left
        transition-colors disabled:opacity-40 disabled:pointer-events-none
        ${tone === 'danger' ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="text-2xs text-slate-600 font-semibold">{shortcut}</span>}
    </button>
  );
}

export function MenuLabel({ children }) {
  return <div className="px-2 pt-2 pb-1 micro-label">{children}</div>;
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-slate-200" role="separator" />;
}
