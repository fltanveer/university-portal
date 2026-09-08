import { useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarPlus, Copy, GraduationCap, Info, ListChecks, Save, Settings2, Trash2,
  TriangleAlert, Users, Layers,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { FACULTIES } from '../data/mockData';
import { evaluateEligibility, intakeStatus } from '../lib/eligibility';
import { currency, formatDate, number } from '../lib/format';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import Progress from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TextField, TextArea, SelectField, Toggle } from '../components/ui/Field';
import { EligibilityPill } from '../components/app/StatusPills';

const LEVELS = ['Bachelor', 'Master', 'PhD'];
const TERMS = ['Semester 1', 'Semester 2', 'Trimester 1', 'Trimester 2', 'Trimester 3'];

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function CourseDetail({ id }) {
  const { state, dispatch, toast } = useStore();
  const { navigate } = useRoute();
  const course = state.courses.find((c) => c.id === id);

  const [tab, setTab] = useState('details');
  const [duplicating, setDuplicating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [newIntake, setNewIntake] = useState(null);

  const applicants = useMemo(
    () => state.applicants.filter((a) => a.courseId === id),
    [state.applicants, id]
  );

  // Recomputed on every requirements edit — this is the link the brief asks for.
  const eligibilityBreakdown = useMemo(() => {
    if (!course) return { meets: 0, borderline: 0, not_met: 0 };
    return applicants.reduce(
      (acc, a) => {
        acc[evaluateEligibility(a, course).status] += 1;
        return acc;
      },
      { meets: 0, borderline: 0, not_met: 0 }
    );
  }, [applicants, course]);

  if (!course) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Course not found"
        description="This course may have been removed from your listing."
        action={
          <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/courses')}>
            Back to courses
          </Button>
        }
      />
    );
  }

  const patch = (p) => dispatch({ type: 'UPDATE_COURSE', id: course.id, patch: p });
  const patchReq = (p) => dispatch({ type: 'UPDATE_REQUIREMENTS', id: course.id, patch: p });
  const patchIntake = (intakeId, p) => dispatch({ type: 'UPDATE_INTAKE', courseId: course.id, intakeId, patch: p });

  const TABS = [
    { id: 'details', label: 'Details', icon: Settings2 },
    { id: 'intakes', label: 'Intakes', icon: Layers, count: course.intakes.length },
    { id: 'requirements', label: 'Entry requirements', icon: ListChecks },
    { id: 'applicants', label: 'Applicants', icon: Users, count: applicants.length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[{ label: 'Courses', to: '/courses' }, { label: course.code }]}
        title={course.title}
        meta={
          <>
            <span className="text-xs font-semibold text-slate-600 tabular">{course.code}</span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600">{course.faculty}</span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600">
              {course.level} · {course.duration}
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600 tabular">{currency(course.tuition, course.currency)} / year</span>
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <Toggle
              checked={course.active}
              onChange={(v) => {
                patch({ active: v });
                toast(v ? `${course.code} is live on StudyFound` : `${course.code} hidden from StudyFound`, {
                  tone: v ? 'success' : 'info',
                });
              }}
              label="Listed publicly"
              id="course-active"
            />
          </div>
        }
      />

      {/* At-a-glance impact of the current requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="micro-label">Applicants</p>
          <p className="font-display text-3xl text-brand-950 leading-none mt-1.5 tabular">{number(applicants.length)}</p>
        </div>
        <div className="card p-3">
          <p className="micro-label">Meet requirements</p>
          <p className="font-display text-3xl text-emerald-700 leading-none mt-1.5 tabular">{eligibilityBreakdown.meets}</p>
        </div>
        <div className="card p-3">
          <p className="micro-label">Borderline</p>
          <p className="font-display text-3xl text-amber-700 leading-none mt-1.5 tabular">{eligibilityBreakdown.borderline}</p>
        </div>
        <div className="card p-3">
          <p className="micro-label">Do not meet</p>
          <p className="font-display text-3xl text-rose-700 leading-none mt-1.5 tabular">{eligibilityBreakdown.not_met}</p>
        </div>
      </div>

      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-2" />
        <CardBody>
          {/* ---------------------------------------------------------------- */}
          {tab === 'details' && (
            <div className="max-w-2xl space-y-4">
              <TextField label="Course title" value={course.title} onChange={(e) => patch({ title: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Course code" value={course.code} onChange={(e) => patch({ code: e.target.value })} />
                <SelectField
                  label="Faculty"
                  value={course.faculty}
                  onChange={(e) => patch({ faculty: e.target.value })}
                  options={FACULTIES.map((f) => ({ value: f, label: f }))}
                />
                <SelectField
                  label="Level"
                  value={course.level}
                  onChange={(e) => patch({ level: e.target.value })}
                  options={LEVELS.map((l) => ({ value: l, label: l }))}
                />
                <TextField
                  label="Duration"
                  hint="As shown to students, e.g. “2 years”."
                  value={course.duration}
                  onChange={(e) => patch({ duration: e.target.value })}
                />
              </div>
              <TextField
                label="Tuition per year (AUD)"
                type="number"
                min={0}
                step={100}
                value={course.tuition}
                onChange={(e) => patch({ tuition: num(e.target.value, course.tuition) })}
                inputClassName="tabular"
              />
              <TextArea
                label="Course description"
                hint="Shown on the public StudyFound course page."
                rows={6}
                maxLength={900}
                value={course.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
              <p className="flex items-center gap-1.5 text-2xs text-slate-600">
                <Save className="h-3 w-3" aria-hidden />
                Changes save as you type and persist across refresh.
              </p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {tab === 'intakes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-13 text-slate-600">
                  Intake status is derived from the dates and capacity below — an intake auto-marks
                  <span className="font-semibold"> Full </span>
                  the moment seats filled reaches capacity.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CalendarPlus}
                  onClick={() =>
                    setNewIntake({
                      term: 'Semester 1',
                      year: new Date().getFullYear() + 1,
                      openDate: new Date().toISOString().slice(0, 10),
                      closeDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
                      capacity: 60,
                      filled: 0,
                    })
                  }
                >
                  Add intake
                </Button>
              </div>

              {course.intakes.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="No intakes configured"
                  description="Students cannot apply to this course until at least one intake is open."
                  compact
                />
              ) : (
                <ul className="space-y-2.5">
                  {course.intakes.map((intake) => {
                    const status = intakeStatus(intake);
                    const appCount = applicants.filter((a) => a.intakeId === intake.id).length;
                    return (
                      <li key={intake.id} className="rounded-lg border border-slate-200 p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{intake.label}</p>
                            <p className="text-2xs text-slate-600 tabular">
                              {formatDate(intake.openDate)} — {formatDate(intake.closeDate)} · {appCount} applicants
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={status.tone}>{status.label}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Copy}
                              onClick={() =>
                                setDuplicating({
                                  source: intake,
                                  term: intake.term,
                                  year: intake.year + 1,
                                  openDate: new Date().toISOString().slice(0, 10),
                                  closeDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
                                  capacity: intake.capacity,
                                })
                              }
                            >
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              size="iconSm"
                              aria-label={`Delete ${intake.label}`}
                              onClick={() => setDeleting(intake)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                          <SelectField
                            label="Term"
                            value={intake.term}
                            onChange={(e) => patchIntake(intake.id, { term: e.target.value, label: `${e.target.value} ${intake.year}` })}
                            options={TERMS.map((t) => ({ value: t, label: t }))}
                          />
                          <TextField
                            label="Year"
                            type="number"
                            value={intake.year}
                            onChange={(e) => {
                              const year = num(e.target.value, intake.year);
                              patchIntake(intake.id, { year, label: `${intake.term} ${year}` });
                            }}
                            inputClassName="tabular"
                          />
                          <TextField
                            label="Applications open"
                            type="date"
                            value={intake.openDate.slice(0, 10)}
                            onChange={(e) => patchIntake(intake.id, { openDate: new Date(e.target.value).toISOString() })}
                          />
                          <TextField
                            label="Applications close"
                            type="date"
                            value={intake.closeDate.slice(0, 10)}
                            onChange={(e) => patchIntake(intake.id, { closeDate: new Date(e.target.value).toISOString() })}
                          />
                          <SelectField
                            label="Status override"
                            hint=""
                            value={intake.manualStatus ?? 'auto'}
                            onChange={(e) => patchIntake(intake.id, { manualStatus: e.target.value === 'auto' ? null : e.target.value })}
                            options={[
                              { value: 'auto', label: 'Automatic' },
                              { value: 'closed', label: 'Force closed' },
                            ]}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <TextField
                            label="Seat capacity"
                            type="number"
                            min={0}
                            value={intake.capacity}
                            onChange={(e) => patchIntake(intake.id, { capacity: Math.max(0, num(e.target.value, intake.capacity)) })}
                            inputClassName="tabular"
                          />
                          <TextField
                            label="Seats filled"
                            type="number"
                            min={0}
                            value={intake.filled}
                            onChange={(e) => patchIntake(intake.id, { filled: Math.max(0, num(e.target.value, intake.filled)) })}
                            inputClassName="tabular"
                          />
                        </div>

                        <Progress
                          className="mt-3"
                          value={intake.filled}
                          max={intake.capacity}
                          tone="auto"
                          label={`${intake.filled} of ${intake.capacity} seats filled`}
                          showValue
                        />
                        {intake.filled >= intake.capacity && intake.capacity > 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-2xs font-semibold text-rose-700">
                            <TriangleAlert className="h-3 w-3" aria-hidden />
                            Capacity reached — this intake is automatically marked Full and closed to new offers.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {tab === 'requirements' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h3 className="text-13 font-bold text-slate-900 mb-3">Academic</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      label="Minimum GPA"
                      hint="Normalised to a 4.0 scale."
                      type="number"
                      step={0.1}
                      min={0}
                      max={4}
                      value={course.requirements.minGpa}
                      onChange={(e) => patchReq({ minGpa: num(e.target.value, course.requirements.minGpa) })}
                      inputClassName="tabular"
                    />
                    <TextField
                      label="Work experience (years)"
                      hint="Set 0 if no experience is required."
                      type="number"
                      step={1}
                      min={0}
                      value={course.requirements.workExperienceYears}
                      onChange={(e) => patchReq({ workExperienceYears: num(e.target.value, 0) })}
                      inputClassName="tabular"
                    />
                  </div>
                  <TextField
                    className="mt-4"
                    label="Required prior qualification"
                    value={course.requirements.priorDegree}
                    onChange={(e) => patchReq({ priorDegree: e.target.value })}
                  />
                </div>

                <div>
                  <h3 className="text-13 font-bold text-slate-900 mb-1">English language</h3>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    Each applicant is assessed against the threshold for the test they actually sat. Non-IELTS
                    scores are also converted to an IELTS equivalent for scholarship matching.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <TextField
                      label="IELTS overall"
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      value={course.requirements.minIelts}
                      onChange={(e) => patchReq({ minIelts: num(e.target.value, course.requirements.minIelts) })}
                      inputClassName="tabular"
                    />
                    <TextField
                      label="IELTS per band"
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      value={course.requirements.minIeltsBand}
                      onChange={(e) => patchReq({ minIeltsBand: num(e.target.value, course.requirements.minIeltsBand) })}
                      inputClassName="tabular"
                    />
                    <TextField
                      label="TOEFL iBT total"
                      type="number"
                      min={0}
                      max={120}
                      value={course.requirements.minToefl}
                      onChange={(e) => patchReq({ minToefl: num(e.target.value, course.requirements.minToefl) })}
                      inputClassName="tabular"
                    />
                    <TextField
                      label="PTE Academic"
                      type="number"
                      min={0}
                      max={90}
                      value={course.requirements.minPte}
                      onChange={(e) => patchReq({ minPte: num(e.target.value, course.requirements.minPte) })}
                      inputClassName="tabular"
                    />
                    <TextField
                      label="Duolingo"
                      type="number"
                      min={0}
                      max={160}
                      value={course.requirements.minDuolingo}
                      onChange={(e) => patchReq({ minDuolingo: num(e.target.value, course.requirements.minDuolingo) })}
                      inputClassName="tabular"
                    />
                  </div>
                </div>
              </div>

              {/* Live impact panel */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 rounded-xl border border-royal-200 bg-royal-50/60 p-4">
                  <p className="flex items-center gap-1.5 text-13 font-bold text-royal-900">
                    <Info className="h-3.5 w-3.5" aria-hidden />
                    Live impact
                  </p>
                  <p className="mt-1.5 text-xs text-royal-900/80 leading-relaxed">
                    Every change here re-scores all {applicants.length} applicants on this course immediately,
                    on this screen and everywhere else in the portal.
                  </p>
                  <dl className="mt-3 space-y-2">
                    {[
                      ['Meet requirements', eligibilityBreakdown.meets, 'emerald'],
                      ['Borderline', eligibilityBreakdown.borderline, 'amber'],
                      ['Do not meet', eligibilityBreakdown.not_met, 'rose'],
                    ].map(([label, value, tone]) => (
                      <div key={label}>
                        <div className="flex items-baseline justify-between">
                          <dt className="text-xs font-semibold text-slate-700">{label}</dt>
                          <dd className="font-display text-lg text-brand-950 tabular leading-none">{value}</dd>
                        </div>
                        <Progress value={value} max={applicants.length || 1} tone={tone} size="sm" className="mt-1" />
                      </div>
                    ))}
                  </dl>
                  <Link
                    to={`/applications?course=${course.id}`}
                    className="mt-3 block text-xs font-semibold text-royal-700 hover:underline"
                  >
                    Review these applicants →
                  </Link>
                </div>
              </aside>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {tab === 'applicants' && (
            <>
              {applicants.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No applicants yet"
                  description={`No one has applied to ${course.code}. Check that the course is listed publicly and has an open intake.`}
                  compact
                />
              ) : (
                <ul className="divide-y divide-slate-100 -my-2">
                  {applicants.map((a) => {
                    const result = evaluateEligibility(a, course);
                    return (
                      <li key={a.id}>
                        <Link
                          to={`/applications/${a.id}`}
                          className="flex items-center gap-3 py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors group"
                        >
                          <Avatar name={a.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-13 font-semibold text-slate-800 truncate group-hover:text-royal-700 transition-colors">
                              {a.name}
                            </span>
                            <span className="block text-2xs text-slate-600">
                              {a.nationality} · GPA {a.gpa.value.toFixed(2)} · {a.englishTest.type} {a.englishTest.overall}
                            </span>
                          </span>
                          <EligibilityPill result={result} size="sm" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Duplicate to new intake */}
      <Modal
        open={!!duplicating}
        onClose={() => setDuplicating(null)}
        size="md"
        title="Duplicate to a new intake"
        description={`Copies the seat capacity from ${duplicating?.source?.label} and resets seats filled to zero.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDuplicating(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                dispatch({
                  type: 'ADD_INTAKE',
                  courseId: course.id,
                  intake: {
                    term: duplicating.term,
                    year: duplicating.year,
                    label: `${duplicating.term} ${duplicating.year}`,
                    openDate: new Date(duplicating.openDate).toISOString(),
                    closeDate: new Date(duplicating.closeDate).toISOString(),
                    capacity: duplicating.capacity,
                    filled: 0,
                    manualStatus: null,
                  },
                });
                toast(`${duplicating.term} ${duplicating.year} created`, { description: `Duplicated from ${duplicating.source.label}.` });
                setDuplicating(null);
              }}
            >
              Create intake
            </Button>
          </>
        }
      >
        {duplicating && (
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Term"
              value={duplicating.term}
              onChange={(e) => setDuplicating({ ...duplicating, term: e.target.value })}
              options={TERMS.map((t) => ({ value: t, label: t }))}
            />
            <TextField
              label="Year"
              type="number"
              value={duplicating.year}
              onChange={(e) => setDuplicating({ ...duplicating, year: num(e.target.value, duplicating.year) })}
            />
            <TextField
              label="Applications open"
              type="date"
              value={duplicating.openDate}
              onChange={(e) => setDuplicating({ ...duplicating, openDate: e.target.value })}
            />
            <TextField
              label="Applications close"
              type="date"
              value={duplicating.closeDate}
              onChange={(e) => setDuplicating({ ...duplicating, closeDate: e.target.value })}
            />
            <TextField
              className="col-span-2"
              label="Seat capacity"
              type="number"
              min={0}
              value={duplicating.capacity}
              onChange={(e) => setDuplicating({ ...duplicating, capacity: num(e.target.value, duplicating.capacity) })}
            />
          </div>
        )}
      </Modal>

      {/* Add intake */}
      <Modal
        open={!!newIntake}
        onClose={() => setNewIntake(null)}
        size="md"
        title="Add an intake"
        description="Students can apply to this course as soon as an intake is open."
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewIntake(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                dispatch({
                  type: 'ADD_INTAKE',
                  courseId: course.id,
                  intake: {
                    term: newIntake.term,
                    year: newIntake.year,
                    label: `${newIntake.term} ${newIntake.year}`,
                    openDate: new Date(newIntake.openDate).toISOString(),
                    closeDate: new Date(newIntake.closeDate).toISOString(),
                    capacity: newIntake.capacity,
                    filled: 0,
                    manualStatus: null,
                  },
                });
                toast(`${newIntake.term} ${newIntake.year} added to ${course.code}`);
                setNewIntake(null);
              }}
            >
              Add intake
            </Button>
          </>
        }
      >
        {newIntake && (
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Term"
              value={newIntake.term}
              onChange={(e) => setNewIntake({ ...newIntake, term: e.target.value })}
              options={TERMS.map((t) => ({ value: t, label: t }))}
            />
            <TextField
              label="Year"
              type="number"
              value={newIntake.year}
              onChange={(e) => setNewIntake({ ...newIntake, year: num(e.target.value, newIntake.year) })}
            />
            <TextField
              label="Applications open"
              type="date"
              value={newIntake.openDate}
              onChange={(e) => setNewIntake({ ...newIntake, openDate: e.target.value })}
            />
            <TextField
              label="Applications close"
              type="date"
              value={newIntake.closeDate}
              onChange={(e) => setNewIntake({ ...newIntake, closeDate: e.target.value })}
            />
            <TextField
              className="col-span-2"
              label="Seat capacity"
              type="number"
              min={0}
              value={newIntake.capacity}
              onChange={(e) => setNewIntake({ ...newIntake, capacity: num(e.target.value, newIntake.capacity) })}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.label}?`}
        tone="danger"
        confirmLabel="Delete intake"
        onConfirm={() => {
          dispatch({ type: 'DELETE_INTAKE', courseId: course.id, intakeId: deleting.id });
          toast(`${deleting.label} deleted`, { tone: 'warning' });
        }}
      >
        <p className="text-13 text-slate-600 leading-relaxed">
          {applicants.filter((a) => a.intakeId === deleting?.id).length > 0 ? (
            <>
              <span className="font-semibold text-rose-700">
                {applicants.filter((a) => a.intakeId === deleting?.id).length} applications
              </span>{' '}
              are attached to this intake. They will remain in the pipeline but will no longer show an intake.
            </>
          ) : (
            'No applications are attached to this intake.'
          )}
        </p>
      </ConfirmDialog>
    </div>
  );
}
