export const AVATAR_TONES = [
  'bg-brand-100 text-brand-800',
  'bg-royal-100 text-royal-800',
  'bg-accent-100 text-accent-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
];

export function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toneForName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

const DATE_FMT = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
const DATE_SHORT = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (d) => (d ? DATE_FMT.format(new Date(d)) : '—');
export const formatDateShort = (d) => (d ? DATE_SHORT.format(new Date(d)) : '—');
export const formatDateTime = (d) => (d ? DATETIME_FMT.format(new Date(d)) : '—');

export function daysBetween(a, b = Date.now()) {
  if (!a) return 0;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function relativeTime(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function currency(value, code = 'AUD', compact = false) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}

export const number = (n) => new Intl.NumberFormat('en-AU').format(n ?? 0);

export const pct = (n, digits = 0) => `${(n ?? 0).toFixed(digits)}%`;

export function fileSize(kb) {
  if (kb == null) return '—';
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many ?? one + 's'}`;
