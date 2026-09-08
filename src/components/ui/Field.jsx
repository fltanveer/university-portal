import { useId } from 'react';

/**
 * Top-aligned persistent label, helper text above the control, error below it.
 * Optional fields are marked — required ones are not, since most fields here
 * are required and flagging them all would be pure noise.
 */
export function Field({ label, hint, error, optional, children, className = '', htmlFor }) {
  const autoId = useId();
  const id = htmlFor || autoId;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {optional && <span className="ml-1 font-medium text-slate-500">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-2xs text-slate-600 mb-1.5 leading-relaxed">
          {hint}
        </p>
      )}
      {typeof children === 'function' ? children({ id, describedBy, invalid: !!error }) : children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-2xs font-semibold text-rose-700 flex items-start gap-1">
          <span aria-hidden>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, optional, className, inputClassName = '', ...props }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`input ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${inputClassName}`}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextArea({ label, hint, error, optional, rows = 4, className, maxLength, value, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <>
          <textarea
            id={id}
            rows={rows}
            value={value}
            maxLength={maxLength}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={`textarea ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            {...props}
          />
          {maxLength && (
            <p className="mt-1 text-2xs text-slate-600 text-right tabular">
              {(value || '').length} / {maxLength}
            </p>
          )}
        </>
      )}
    </Field>
  );
}

export function SelectField({ label, hint, error, optional, options, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`select w-full ${invalid ? 'border-rose-400' : ''}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description, disabled, ariaLabel, id: providedId }) {
  const autoId = useId();
  const id = providedId || autoId;
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 h-5 w-9 rounded-full transition-colors duration-200
          disabled:opacity-40 disabled:pointer-events-none
          ${checked ? 'bg-emerald-700' : 'bg-slate-500'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm
            transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
          aria-hidden
        />
      </button>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-13 font-semibold text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-600 leading-relaxed">{description}</span>}
        </label>
      )}
    </div>
  );
}

export default Field;
