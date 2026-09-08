import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-royal-600 text-white border border-royal-600 hover:bg-royal-700 hover:border-royal-700 active:bg-royal-800 shadow-xs',
  brand:
    'bg-brand-900 text-white border border-brand-900 hover:bg-brand-800 hover:border-brand-800 active:bg-brand-950 shadow-xs',
  secondary:
    'bg-white text-slate-700 border border-control hover:bg-slate-50 hover:border-control-hover active:bg-slate-100 shadow-xs',
  ghost: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger:
    'bg-white text-rose-700 border border-rose-400 hover:bg-rose-50 hover:border-rose-500 active:bg-rose-100 shadow-xs',
  dangerSolid:
    'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 hover:border-rose-700 active:bg-rose-800 shadow-xs',
  success:
    'bg-emerald-700 text-white border border-emerald-700 hover:bg-emerald-800 hover:border-emerald-800 active:bg-emerald-900 shadow-xs',
  accent:
    'bg-accent-600 text-white border border-accent-600 hover:bg-accent-700 hover:border-accent-700 active:bg-accent-800 shadow-xs',
  link: 'bg-transparent text-royal-600 border-none hover:text-royal-800 hover:underline underline-offset-2 p-0 h-auto',
};

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-13 gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-13 gap-1.5 rounded-lg',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
  icon: 'h-8 w-8 p-0 rounded-lg',
  iconSm: 'h-7 w-7 p-0 rounded-md',
};

const Button = forwardRef(function Button(
  { as: Tag = 'button', variant = 'secondary', size = 'md', loading, icon: Icon, iconRight: IconRight, className = '', children, disabled, ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap
        transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-out
        active:scale-[0.96] disabled:opacity-55 disabled:pointer-events-none select-none
        ${VARIANTS[variant]} ${variant === 'link' ? '' : SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
      ) : Icon ? (
        <Icon className={size === 'lg' ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden />
      ) : null}
      {children}
      {IconRight && <IconRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
    </Tag>
  );
});

export default Button;
