import { useMemo } from 'react';
import {
  AlertCircle, ArrowRight, CalendarClock, FileText, Globe2, GraduationCap, TrendingDown, Inbox, Timer, Wallet,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RTooltip } from 'recharts';
import { useStore } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { CURRENT_USER, COUNTRIES, stageById } from '../data/mockData';
import { computeKpis, computeFunnel, needsAttention, groupCount, upcomingDeadlines } from '../lib/metrics';
import { intakeStatus } from '../lib/eligibility';
import { formatDate, number } from '../lib/format';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import Progress from '../components/ui/Progress';
import { AgeIndicator } from '../components/app/StatusPills';

const KPI_ICONS = { new: Inbox, awaiting: Timer, offers: FileText, deposits: Wallet };

function ChartTooltip({ active, payload, label, suffix = 'applications' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-brand-950 px-2.5 py-1.5 text-xs text-white shadow-pop">
      <p className="font-bold">{label}</p>
      <p className="text-slate-300">
        {number(payload[0].value)} {suffix}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useStore();
  const { navigate } = useRoute();
  const { applicants, courses } = state;

  const kpis = useMemo(() => computeKpis(applicants), [applicants]);
  const funnel = useMemo(() => computeFunnel(applicants), [applicants]);
  const attention = useMemo(() => needsAttention(applicants, 5), [applicants]);
  const myQueue = useMemo(
    () => applicants.filter((a) => a.assignedReviewer === CURRENT_USER.id && stageById(a.stage).order <= 5).length,
    [applicants]
  );

  const byCountry = useMemo(
    () =>
      groupCount(applicants, (a) => a.countryCode, (code) => COUNTRIES.find((c) => c.code === code)?.name || code),
    [applicants]
  );

  const byCourse = useMemo(
    () =>
      groupCount(applicants, (a) => a.courseId, (id) => courses.find((c) => c.id === id)?.title || 'Unknown').slice(0, 5),
    [applicants, courses]
  );

  const deadlines = useMemo(() => upcomingDeadlines(courses, 150).slice(0, 6), [courses]);
  const maxFunnel = funnel[0]?.value || 1;

  return (
    <div className="space-y-5">
      <PageHeader
        size="lg"
        title="Admissions overview"
        description={`Live position across every open intake at ${state.university.name}.`}
        meta={
          <>
            <span className="text-xs text-slate-600">
              <span className="font-bold text-slate-800 tabular">{number(applicants.length)}</span> total applications
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600">
              <span className="font-bold text-slate-800 tabular">{myQueue}</span> assigned to you
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600">
              <span className="font-bold text-slate-800 tabular">{courses.filter((c) => c.active).length}</span> active courses
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={GraduationCap} onClick={() => navigate('/courses')}>
              Manage courses
            </Button>
            <Button variant="primary" icon={FileText} onClick={() => navigate('/applications')}>
              Review applications
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <StatCard
            key={k.id}
            label={k.label}
            value={number(k.value)}
            change={k.change}
            hint={k.hint}
            tone={k.tone}
            sentiment={k.sentiment}
            icon={KPI_ICONS[k.id]}
            onClick={() =>
              navigate(k.filter.stage.length ? `/applications?stage=${k.filter.stage.join(',')}` : '/applications')
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Admissions funnel"
            description="Conversion between each stage, across all intakes currently in the pipeline."
            icon={TrendingDown}
          />
          <CardBody className="space-y-3">
            {funnel.map((step, i) => (
              <div key={step.id}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-13 font-bold text-slate-800">{step.label}</span>
                    {step.conversion != null && (
                      <span
                        className={`text-2xs font-bold tabular ${
                          step.conversion >= 60 ? 'text-emerald-700' : step.conversion >= 30 ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {step.conversion}% carried through
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    {step.dropOff > 0 && (
                      <span className="text-2xs font-semibold text-slate-600 tabular">−{step.dropOff} lost</span>
                    )}
                    <span className="font-display text-lg text-brand-950 leading-none tabular">{step.value}</span>
                  </div>
                </div>
                <div className="h-7 w-full rounded-md bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-md transition-[width] duration-700 flex items-center px-2"
                    style={{
                      width: `${Math.max(3, (step.value / maxFunnel) * 100)}%`,
                      backgroundColor: ['#140B4F', '#31266B', '#2563EB', '#7C3AED', '#047857'][i],
                    }}
                  >
                    <span className="text-2xs font-bold text-white/90 tabular">{step.ofTotal}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
          <CardFooter className="flex items-center justify-between">
            <p className="text-2xs text-slate-600">
              Overall applied → deposit conversion:{' '}
              <span className="font-bold text-slate-800 tabular">
                {funnel[0]?.value ? Math.round((funnel[4].value / funnel[0].value) * 100) : 0}%
              </span>
            </p>
            <Button variant="link" size="sm" iconRight={ArrowRight} onClick={() => navigate('/analytics')}>
              Full analytics
            </Button>
          </CardFooter>
        </Card>

        {/* Needs attention */}
        <Card className="flex flex-col">
          <CardHeader
            title="Needs your attention"
            description="Sitting five days or more without a stage change."
            icon={AlertCircle}
            action={
              attention.length > 0 && (
                <Badge tone="rose" solid size="sm">
                  {attention.length}
                </Badge>
              )
            }
          />
          <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[26rem]">
            {attention.length === 0 ? (
              <EmptyState
                compact
                icon={AlertCircle}
                title="Nothing is overdue"
                description="Every open application has moved within the last five days."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {attention.slice(0, 8).map((a) => {
                  const course = courses.find((c) => c.id === a.courseId);
                  return (
                    <li key={a.id}>
                      <Link
                        to={`/applications/${a.id}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                      >
                        <Avatar name={a.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-13 font-semibold text-slate-800 truncate group-hover:text-royal-700 transition-colors">
                            {a.name}
                          </span>
                          <span className="block text-2xs text-slate-600 truncate">
                            {stageById(a.stage).label} · {course?.title}
                          </span>
                        </span>
                        <AgeIndicator days={a.daysWaiting} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {attention.length > 8 && (
            <CardFooter>
              <Button
                variant="link"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => navigate('/applications?sort=daysInStage')}
              >
                View all {attention.length} overdue
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* By country */}
        <Card>
          <CardHeader title="Applications by country" description="All stages, current cycle." icon={Globe2} />
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={82}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {byCountry.map((_, i) => (
                      <Cell key={i} fill={['#140B4F', '#2563EB', '#6D28D9', '#0284C7', '#047857', '#B45309'][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* By course */}
        <Card>
          <CardHeader title="Top 5 courses by volume" description="Where demand is concentrated." icon={GraduationCap} />
          <CardBody className="space-y-3">
            {byCourse.map((c, i) => (
              <Link key={c.key} to={`/courses/${c.key}`} className="block group">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-13 font-semibold text-slate-700 truncate group-hover:text-royal-700 transition-colors">
                    {c.label}
                  </span>
                  <span className="text-13 font-bold text-slate-900 tabular shrink-0">{c.value}</span>
                </div>
                <Progress value={c.value} max={byCourse[0].value} tone={['brand', 'royal', 'accent', 'sky', 'emerald'][i]} size="sm" />
              </Link>
            ))}
            {byCourse.length === 0 && <EmptyState compact icon={GraduationCap} title="No applications yet" />}
          </CardBody>
        </Card>

        {/* Deadlines */}
        <Card className="flex flex-col">
          <CardHeader title="Upcoming intake deadlines" description="Application close dates in the next 150 days." icon={CalendarClock} />
          <div className="flex-1">
            {deadlines.length === 0 ? (
              <EmptyState compact icon={CalendarClock} title="No deadlines approaching" description="No intake closes within the next 150 days." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {deadlines.map(({ course, intake, closesIn }) => {
                  const status = intakeStatus(intake);
                  return (
                    <li key={intake.id}>
                      <Link to={`/courses/${course.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
                        <span
                          className={`grid place-items-center h-9 w-11 shrink-0 rounded-lg font-display leading-none
                            ${closesIn <= 30 ? 'bg-rose-50 text-rose-700' : closesIn <= 60 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                        >
                          <span className="text-base tabular">{closesIn}</span>
                          <span className="sr-only">days</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-13 font-semibold text-slate-800 truncate group-hover:text-royal-700 transition-colors">
                            {intake.label}
                          </span>
                          <span className="block text-2xs text-slate-600 truncate">{course.title}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <Badge tone={status.tone} size="sm">{status.label}</Badge>
                          <span className="block mt-0.5 text-2xs text-slate-600 tabular">{formatDate(intake.closeDate)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
