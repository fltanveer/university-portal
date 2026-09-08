import { initials, toneForName } from '../../lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-7 w-7 text-2xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
};

/**
 * Applicant photos are placeholders in this build — a deterministic initials
 * tile, which never breaks and reads cleanly at table density.
 */
export default function Avatar({ name = '', src = null, size = 'md', className = '', ring = false }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${SIZES[size]} rounded-full object-cover shrink-0 ${ring ? 'ring-2 ring-white' : ''} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} ${toneForName(name)} rounded-full shrink-0 grid place-items-center
        font-bold tracking-tight select-none ${ring ? 'ring-2 ring-white' : ''} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
