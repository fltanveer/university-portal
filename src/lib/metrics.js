import { STAGES, FUNNEL_STEPS, stageById } from '../data/mockData';
import { daysBetween } from './format';

const DAY = 86400000;

/**
 * Reconstructs an application's stage at an arbitrary point in time from its own
 * timeline. This is what makes the month-over-month deltas real rather than
 * decorative — the "last month" figure is the portfolio as it actually stood.
 */
export function stageAsOf(applicant, ts) {
  const t = new Date(ts).getTime();
  if (new Date(applicant.applicationDate).getTime() > t) return null;
  const events = applicant.timeline
    .filter((e) => e.type === 'stage' && e.stage)
    .filter((e) => new Date(e.at).getTime() <= t)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  return events.length ? events[events.length - 1].stage : 'new';
}

const IS = {
  awaitingDecision: (s) => s && stageById(s).order >= 1 && stageById(s).order <= 5,
  offerOut: (s) => s === 'offer_conditional' || s === 'offer_unconditional',
  depositPaid: (s) => s === 'deposit_paid',
  accepted: (s) => s === 'accepted' || s === 'deposit_paid',
};

function delta(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeKpis(applicants, now = Date.now()) {
  const monthAgo = now - 30 * DAY;
  const twoMonthsAgo = now - 60 * DAY;

  const newThisMonth = applicants.filter((a) => new Date(a.applicationDate).getTime() >= monthAgo).length;
  const newLastMonth = applicants.filter((a) => {
    const t = new Date(a.applicationDate).getTime();
    return t >= twoMonthsAgo && t < monthAgo;
  }).length;

  const countNow = (pred) => applicants.filter((a) => pred(a.stage)).length;
  const countThen = (pred) => applicants.filter((a) => pred(stageAsOf(a, monthAgo))).length;

  return [
    {
      id: 'new',
      label: 'New applications',
      value: newThisMonth,
      change: delta(newThisMonth, newLastMonth),
      hint: `${newLastMonth} in the previous 30 days`,
      tone: 'royal',
      sentiment: 'higher-is-better',
      filter: { stage: [] },
    },
    {
      id: 'awaiting',
      label: 'Awaiting decision',
      value: countNow(IS.awaitingDecision),
      change: delta(countNow(IS.awaitingDecision), countThen(IS.awaitingDecision)),
      hint: 'Submitted through to interview',
      tone: 'amber',
      // A growing queue is a backlog, not a success — no green.
      sentiment: 'neutral',
      filter: { stage: ['new', 'under_review', 'shortlisted', 'documents_requested', 'interview'] },
    },
    {
      id: 'offers',
      label: 'Offers pending response',
      value: countNow(IS.offerOut),
      change: delta(countNow(IS.offerOut), countThen(IS.offerOut)),
      hint: 'Conditional and unconditional',
      tone: 'accent',
      sentiment: 'neutral',
      filter: { stage: ['offer_conditional', 'offer_unconditional'] },
    },
    {
      id: 'deposits',
      label: 'Confirmed deposits',
      value: countNow(IS.depositPaid),
      change: delta(countNow(IS.depositPaid), countThen(IS.depositPaid)),
      hint: 'Places secured for upcoming intakes',
      tone: 'emerald',
      sentiment: 'higher-is-better',
      filter: { stage: ['deposit_paid'] },
    },
  ];
}

export function computeFunnel(applicants) {
  const counts = FUNNEL_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    value: applicants.filter(step.match).length,
  }));
  const top = counts[0]?.value || 1;
  return counts.map((c, i) => ({
    ...c,
    ofTotal: Math.round((c.value / (top || 1)) * 100),
    conversion: i === 0 ? null : counts[i - 1].value === 0 ? 0 : Math.round((c.value / counts[i - 1].value) * 100),
    dropOff: i === 0 ? null : counts[i - 1].value - c.value,
  }));
}

export function needsAttention(applicants, thresholdDays = 5) {
  return applicants
    .filter((a) => stageById(a.stage).order <= 5 && daysBetween(a.stageChangedAt) >= thresholdDays)
    .map((a) => ({ ...a, daysWaiting: daysBetween(a.stageChangedAt) }))
    .sort((a, b) => b.daysWaiting - a.daysWaiting);
}

export function groupCount(items, keyFn, labelFn = (k) => k) {
  const map = new Map();
  items.forEach((it) => {
    const k = keyFn(it);
    if (k == null) return;
    map.set(k, (map.get(k) || 0) + 1);
  });
  return [...map.entries()]
    .map(([key, value]) => ({ key, label: labelFn(key), value }))
    .sort((a, b) => b.value - a.value);
}

export function upcomingDeadlines(courses, withinDays = 120, now = Date.now()) {
  return courses
    .filter((c) => c.active)
    .flatMap((c) =>
      c.intakes.map((i) => ({
        course: c,
        intake: i,
        closesIn: Math.ceil((new Date(i.closeDate).getTime() - now) / DAY),
      }))
    )
    .filter((d) => d.closesIn >= 0 && d.closesIn <= withinDays)
    .sort((a, b) => a.closesIn - b.closesIn);
}

/** Applications submitted per week/month, for the trend line. */
export function applicationsOverTime(applicants, { from, to, bucket = 'week' } = {}) {
  const start = from ? new Date(from).getTime() : Math.min(...applicants.map((a) => new Date(a.applicationDate).getTime()));
  const end = to ? new Date(to).getTime() : Date.now();
  const size = bucket === 'month' ? 30 * DAY : bucket === 'day' ? DAY : 7 * DAY;

  const buckets = [];
  for (let t = start; t <= end; t += size) buckets.push({ t, submitted: 0, offers: 0 });
  if (!buckets.length) return [];

  applicants.forEach((a) => {
    const at = new Date(a.applicationDate).getTime();
    if (at < start || at > end) return;
    const idx = Math.min(buckets.length - 1, Math.floor((at - start) / size));
    buckets[idx].submitted += 1;
  });

  applicants.forEach((a) => {
    a.timeline
      .filter((e) => e.type === 'stage' && (e.stage === 'offer_conditional' || e.stage === 'offer_unconditional'))
      .forEach((e) => {
        const at = new Date(e.at).getTime();
        if (at < start || at > end) return;
        const idx = Math.min(buckets.length - 1, Math.floor((at - start) / size));
        buckets[idx].offers += 1;
      });
  });

  return buckets.map((b) => ({
    ...b,
    label: new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(b.t)),
  }));
}

/** Days from submission to the first decision event (offer, reject or waitlist). */
export function timeToDecision(applicants) {
  const DECISIVE = ['offer_conditional', 'offer_unconditional', 'rejected', 'waitlisted'];
  const durations = applicants
    .map((a) => {
      const decision = a.timeline
        .filter((e) => e.type === 'stage' && DECISIVE.includes(e.stage))
        .sort((x, y) => new Date(x.at) - new Date(y.at))[0];
      if (!decision) return null;
      return Math.max(0, daysBetween(a.applicationDate, decision.at));
    })
    .filter((d) => d != null);

  if (!durations.length) return { average: 0, median: 0, count: 0, fastest: 0, slowest: 0 };
  const sorted = [...durations].sort((a, b) => a - b);
  return {
    average: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
    median: sorted[Math.floor(sorted.length / 2)],
    count: durations.length,
    fastest: sorted[0],
    slowest: sorted[sorted.length - 1],
  };
}

export function offerAcceptanceRate(applicants) {
  const offered = applicants.filter((a) =>
    a.timeline.some((e) => e.type === 'stage' && (e.stage === 'offer_conditional' || e.stage === 'offer_unconditional'))
  );
  const accepted = offered.filter((a) => ['accepted', 'deposit_paid'].includes(a.stage));
  const deposited = offered.filter((a) => a.stage === 'deposit_paid');
  return {
    offered: offered.length,
    accepted: accepted.length,
    deposited: deposited.length,
    acceptanceRate: offered.length ? Math.round((accepted.length / offered.length) * 100) : 0,
    depositRate: accepted.length ? Math.round((deposited.length / accepted.length) * 100) : 0,
  };
}

export { STAGES, FUNNEL_STEPS, stageById };
