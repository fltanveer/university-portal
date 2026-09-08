import { useMemo, useState } from 'react';
import {
  BarChart3, CalendarRange, Download, Gauge, Globe2, GraduationCap, Layers, Percent, Timer, TrendingDown,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { useStore, useLookups } from '../store/AppStore';
import { COUNTRIES } from '../data/mockData';
import {
  computeFunnel, groupCount, applicationsOverTime, timeToDecision, offerAcceptanceRate,
} from '../lib/metrics';
import { number, pct } from '../lib/format';
import { exportCsv } from '../lib/csv';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const RANGES = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '180', label: 'Last 6 months', days: 180 },
  { id: 'all', label: 'All time', days: null },
];

// Every series ≥3:1 against white (WCAG 1.4.11 for graphical objects), ordered so
// neighbouring entries also differ in lightness, not just hue.
const SERIES = ['#140B4F', '#2563EB', '#6D28D9', '#0284C7', '#047857', '#B45309'];

function ChartTip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-brand-950 px-2.5 py-1.5 text-xs text-white shadow-pop">
      <p className="font-bold mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle" style={{ background: p.color }} aria-hidden />
          {formatter ? formatter(p) : `${p.name}: ${number(p.value)}`}
        </p>
      ))}
    </div>
  );
}

function MetricTile({ label, value, sub, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'text-brand-800 bg-brand-50',
    royal: 'text-royal-600 bg-royal-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    accent: 'text-accent-600 bg-accent-50',
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="micro-label">{label}</p>
        {Icon && (
          <span className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${tones[tone]}`} aria-hidden>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="font-display text-4xl text-brand-950 leading-none mt-3 tabular">{value}</p>
      {sub && <p className="mt-2 text-2xs text-slate-600 leading-relaxed">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { state, toast } = useStore();
  const { courseById, intakeById } = useLookups();
  const [rangeId, setRangeId] = useState('90');
  const range = RANGES.find((r) => r.id === rangeId);

  const from = range.days ? Date.now() - range.days * 86400000 : null;

  const scoped = useMemo(
    () => (from ? state.applicants.filter((a) => new Date(a.applicationDate).getTime() >= from) : state.applicants),
    [state.applicants, from]
  );

  const funnel = useMemo(() => computeFunnel(scoped), [scoped]);
  const decision = useMemo(() => timeToDecision(scoped), [scoped]);
  const offers = useMemo(() => offerAcceptanceRate(scoped), [scoped]);

  const series = useMemo(
    () => applicationsOverTime(scoped, { from, bucket: range.days && range.days <= 30 ? 'day' : 'week' }),
    [scoped, from, range.days]
  );

  const byCountry = useMemo(
    () => groupCount(scoped, (a) => a.countryCode, (c) => COUNTRIES.find((x) => x.code === c)?.name ?? c),
    [scoped]
  );
  const byCourse = useMemo(
    () => groupCount(scoped, (a) => a.courseId, (id) => courseById[id]?.code ?? '—').slice(0, 8),
    [scoped, courseById]
  );
  const byIntake = useMemo(
    () => groupCount(scoped, (a) => a.intakeId, (id) => intakeById[id]?.label ?? 'Unassigned'),
    [scoped, intakeById]
  );

  const exportSummary = () => {
    const count = exportCsv(
      `analytics-${rangeId}-${new Date().toISOString().slice(0, 10)}`,
      [
        { label: 'Metric', get: (r) => r.metric },
        { label: 'Value', get: (r) => r.value },
      ],
      [
        { metric: 'Date range', value: range.label },
        { metric: 'Applications', value: scoped.length },
        ...funnel.map((f) => ({ metric: `Funnel — ${f.label}`, value: f.value })),
        ...funnel.filter((f) => f.conversion != null).map((f) => ({ metric: `Conversion into ${f.label} (%)`, value: f.conversion })),
        { metric: 'Average time to decision (days)', value: decision.average },
        { metric: 'Median time to decision (days)', value: decision.median },
        { metric: 'Offers made', value: offers.offered },
        { metric: 'Offer acceptance rate (%)', value: offers.acceptanceRate },
        { metric: 'Deposit conversion rate (%)', value: offers.depositRate },
        ...byCountry.map((c) => ({ metric: `Applications — ${c.label}`, value: c.value })),
        ...byCourse.map((c) => ({ metric: `Applications — ${c.label}`, value: c.value })),
      ]
    );
    toast(`Exported ${count} analytics rows to CSV`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        description="Pipeline performance across the selected window. Every figure is computed from the live application records."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-control bg-white p-0.5" role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRangeId(r.id)}
                  aria-pressed={r.id === rangeId}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors
                    ${r.id === rangeId ? 'bg-brand-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" icon={Download} onClick={exportSummary}>
              Export
            </Button>
          </>
        }
      />

      {scoped.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No applications in this window"
            description={`No one applied in the ${range.label.toLowerCase()}. Widen the date range to see historical performance.`}
            action={
              <Button variant="secondary" icon={CalendarRange} onClick={() => setRangeId('all')}>
                Show all time
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricTile
              label="Applications"
              value={number(scoped.length)}
              sub={`${range.label} · ${number(state.applicants.length)} all time`}
              icon={Layers}
              tone="royal"
            />
            <MetricTile
              label="Avg time to decision"
              value={`${decision.average}d`}
              sub={`Median ${decision.median}d · fastest ${decision.fastest}d · slowest ${decision.slowest}d, across ${decision.count} decided applications`}
              icon={Timer}
              tone="accent"
            />
            <MetricTile
              label="Offer acceptance rate"
              value={pct(offers.acceptanceRate)}
              sub={`${offers.accepted} accepted of ${offers.offered} offers made`}
              icon={Percent}
              tone="emerald"
            />
            <MetricTile
              label="Deposit conversion"
              value={pct(offers.depositRate)}
              sub={`${offers.deposited} deposits paid of ${offers.accepted} acceptances`}
              icon={Gauge}
              tone="brand"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Applications over time"
                description="Submissions and offers issued, by week."
                icon={BarChart3}
              />
              <CardBody>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradOffers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} minTickGap={22} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RTooltip content={<ChartTip />} />
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 6 }}
                      />
                      <Area type="monotone" name="Submitted" dataKey="submitted" stroke="#2563EB" strokeWidth={2} fill="url(#gradSubmitted)" />
                      <Area type="monotone" name="Offers issued" dataKey="offers" stroke="#7C3AED" strokeWidth={2} fill="url(#gradOffers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Funnel conversion" description="Share carried into each successive stage." icon={TrendingDown} />
              <CardBody className="space-y-3">
                {funnel.map((step, i) => (
                  <div key={step.id}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-13 font-semibold text-slate-700">{step.label}</span>
                      <span className="font-display text-base text-brand-950 tabular leading-none">{step.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${Math.max(2, step.ofTotal)}%`, backgroundColor: SERIES[i] }}
                      />
                    </div>
                    {step.conversion != null && (
                      <p className="mt-1 text-2xs text-slate-600 tabular">
                        <span className={`font-bold ${step.conversion >= 60 ? 'text-emerald-700' : step.conversion >= 30 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {step.conversion}%
                        </span>{' '}
                        carried through · {step.dropOff} dropped
                      </p>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="By country" icon={Globe2} />
              <CardBody>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={82} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <RTooltip content={<ChartTip formatter={(p) => `${number(p.value)} applications`} />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} name="Applications">
                        {byCountry.map((_, i) => (
                          <Cell key={i} fill={SERIES[i % SERIES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="By course" description="Top 8 by application volume." icon={GraduationCap} />
              <CardBody>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCourse} margin={{ left: -22, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={54} interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RTooltip content={<ChartTip formatter={(p) => `${number(p.value)} applications`} />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={22} name="Applications" fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="By intake" description="Where demand is landing." icon={Layers} />
              <CardBody className="space-y-2.5">
                {byIntake.slice(0, 8).map((i, idx) => (
                  <div key={i.key}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-13 font-semibold text-slate-700 truncate">{i.label}</span>
                      <span className="text-13 font-bold text-slate-900 tabular shrink-0">{i.value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(i.value / byIntake[0].value) * 100}%`, backgroundColor: SERIES[idx % SERIES.length] }}
                      />
                    </div>
                  </div>
                ))}
                {byIntake.length === 0 && <EmptyState compact icon={Layers} title="No intake data" />}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
