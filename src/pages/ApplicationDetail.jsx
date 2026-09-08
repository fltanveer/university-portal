import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, Award, CheckCircle2, ChevronDown, FileText, GraduationCap, Lock, MessageSquareQuote, ShieldCheck, Trash2, User, XCircle, ShieldAlert, Send, Users,
} from 'lucide-react';
import { useStore, useLookups } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { COUNTRIES, CURRENT_USER, stageById } from '../data/mockData';
import { evaluateEligibility, evaluateScholarship } from '../lib/eligibility';
import { daysBetween, relativeTime, currency } from '../lib/format';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import Dropdown, { MenuItem, MenuLabel } from '../components/ui/Dropdown';
import { StageBadge, EligibilityPill, AgeIndicator } from '../components/app/StatusPills';
import DecisionBar from '../components/app/DecisionBar';
import OfferLetterPreview from '../components/app/OfferLetterPreview';
import { ProfileTab, AcademicsTab, DocumentsTab, SopTab, TimelineTab } from '../components/app/ApplicantTabs';

export default function ApplicationDetail({ id }) {
  const { state, dispatch, toast } = useStore();
  const { navigate } = useRoute();
  const { courseById, intakeById, reviewerById } = useLookups();

  const [tab, setTab] = useState('profile');
  // The page header already names the applicant. The sticky bar repeats that
  // identity only once the header has scrolled out of view.
  const headerRef = useRef(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [note, setNote] = useState('');
  const [offerPreview, setOfferPreview] = useState(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setHeaderHidden(true); // no observer support — keep the context visible
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => setHeaderHidden(!entry.isIntersecting), {
      rootMargin: '-104px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  const applicant = state.applicants.find((a) => a.id === id);
  const course = applicant ? courseById[applicant.courseId] : null;
  const intake = applicant ? intakeById[applicant.intakeId] : null;

  const eligibility = useMemo(
    () => (applicant ? evaluateEligibility(applicant, course) : null),
    [applicant, course]
  );

  const scholarshipMatches = useMemo(() => {
    if (!applicant) return [];
    return state.scholarships
      .filter((s) => s.active)
      .map((s) => ({ scheme: s, result: evaluateScholarship(applicant, s, course) }));
  }, [applicant, course, state.scholarships]);

  if (!applicant) {
    return (
      <EmptyState
        icon={FileText}
        title="Application not found"
        description="This application may have been removed, or the link is out of date."
        action={
          <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/applications')}>
            Back to applications
          </Button>
        }
      />
    );
  }

  const country = COUNTRIES.find((c) => c.code === applicant.countryCode);
  const reviewer = applicant.assignedReviewer ? reviewerById[applicant.assignedReviewer] : null;
  const daysInStage = daysBetween(applicant.stageChangedAt);
  const pendingDocs = applicant.documents.filter((d) => d.status === 'pending').length;

  // -- Actions --------------------------------------------------------------
  const handleDecision = ({ stage, note: noteText, interviewDate, conditions }) => {
    dispatch({ type: 'MOVE_STAGE', id: applicant.id, stage, note: noteText, interviewDate, conditions });
    toast(`Moved to ${stageById(stage).label}`, { description: noteText, tone: stage === 'rejected' ? 'warning' : 'success' });
  };

  const handleOffer = ({ stage, templateId, conditions }) => {
    dispatch({ type: 'MOVE_STAGE', id: applicant.id, stage, conditions, note: `${stageById(stage).label} issued` });
    const template = state.templates.find((t) => t.id === templateId);
    // Read the applicant back with the conditions applied so the letter merges correctly.
    setOfferPreview({ template, conditions });
    toast(`${stageById(stage).label} recorded`, { description: 'Review the generated letter before sending.' });
  };

  const sendOffer = ({ subject, body }) => {
    dispatch({
      type: 'SEND_MESSAGE',
      message: {
        templateId: offerPreview.template.id,
        templateName: offerPreview.template.name,
        subject,
        body,
        recipients: [{ id: applicant.id, name: applicant.name, email: applicant.email }],
      },
    });
    setOfferPreview(null);
    toast(`Offer letter sent to ${applicant.name}`, { description: applicant.email });
  };

  const addNote = () => {
    if (!note.trim()) return;
    dispatch({ type: 'ADD_NOTE', id: applicant.id, text: note.trim() });
    setNote('');
    toast('Internal note added', { tone: 'info' });
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'academics', label: 'Academics', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText, count: pendingDocs || undefined },
    { id: 'sop', label: 'SOP & References', icon: MessageSquareQuote },
    { id: 'timeline', label: 'Timeline', icon: Activity, count: applicant.timeline.length },
  ];

  return (
    <div className="space-y-4">
      <div ref={headerRef}>
      <PageHeader
        breadcrumbs={[
          { label: 'Applications', to: '/applications' },
          { label: applicant.name },
        ]}
        title={applicant.name}
        meta={
          <>
            <span className="text-xs text-slate-600 tabular font-semibold">{applicant.reference}</span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600">
              <span aria-hidden className="mr-1">{country?.flag}</span>
              {applicant.nationality}
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <Link to={`/courses/${course?.id}`} className="text-xs font-semibold text-royal-700 hover:underline">
              {course?.title}
            </Link>
            <span className="text-xs text-slate-600">· {intake?.label}</span>
          </>
        }
        actions={
          <>
            <StageBadge stage={applicant.stage} />
            <AgeIndicator days={daysInStage} />
          </>
        }
      />
      </div>

      {/* Decision bar — sticky so it stays reachable while reading the file */}
      <div className="sticky top-topbar z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5
        bg-white/90 backdrop-blur-md border-y border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-hidden={!headerHidden}
            className={`flex items-center gap-2.5 shrink-0 transition-opacity duration-200
              ${headerHidden ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Avatar name={applicant.name} size="md" />
            <div className="hidden sm:block leading-tight">
              <p className="text-13 font-bold text-slate-900">{applicant.name}</p>
              <p className="text-2xs text-slate-600">
                {applicant.degreeSought} · GPA {applicant.gpa.value.toFixed(2)} · {applicant.englishTest.type} {applicant.englishTest.overall}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <DecisionBar applicant={applicant} onDecision={handleDecision} onOffer={handleOffer} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Main column */}
        <div className="xl:col-span-7 min-w-0">
          <Card>
            <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-2" />
            <CardBody>
              {tab === 'profile' && <ProfileTab applicant={applicant} course={course} intake={intake} />}
              {tab === 'academics' && <AcademicsTab applicant={applicant} course={course} eligibility={eligibility} />}
              {tab === 'documents' && (
                <DocumentsTab
                  applicant={applicant}
                  onApprove={(doc) => {
                    dispatch({ type: 'SET_DOC_STATUS', id: applicant.id, docId: doc.id, status: 'approved' });
                    toast(`Approved “${doc.name}”`);
                  }}
                  onReject={(doc, reason, alsoRequest) => {
                    dispatch({ type: 'SET_DOC_STATUS', id: applicant.id, docId: doc.id, status: 'rejected', reason });
                    if (alsoRequest) dispatch({ type: 'REQUEST_REPLACEMENT', id: applicant.id, docId: doc.id });
                    toast(`Rejected “${doc.name}”`, {
                      tone: 'warning',
                      description: alsoRequest ? 'Replacement requested from the applicant.' : reason,
                    });
                  }}
                  onRequestReplacement={(doc) => {
                    dispatch({ type: 'REQUEST_REPLACEMENT', id: applicant.id, docId: doc.id });
                    toast(`Replacement requested for “${doc.name}”`, { tone: 'info' });
                  }}
                  onReset={(doc) => {
                    dispatch({ type: 'SET_DOC_STATUS', id: applicant.id, docId: doc.id, status: 'pending' });
                    toast(`“${doc.name}” reset to pending`, { tone: 'info' });
                  }}
                />
              )}
              {tab === 'sop' && <SopTab applicant={applicant} />}
              {tab === 'timeline' && <TimelineTab applicant={applicant} />}
            </CardBody>
          </Card>
        </div>

        {/* Right rail */}
        <div className="xl:col-span-5 space-y-4 min-w-0">
          {/* Eligibility */}
          <Card>
            <CardHeader
              title="Eligibility"
              icon={ShieldCheck}
              action={<EligibilityPill result={eligibility} showTooltip={false} />}
            />
            <CardBody className="space-y-2.5">
              <p className="text-13 text-slate-600 leading-relaxed">{eligibility.summary}</p>
              <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 gap-y-1.5">
                <span className="micro-label">Requirement</span>
                <span className="micro-label text-right">Has</span>
                <span className="micro-label text-right">Needs</span>
                {eligibility.checks.map((c) => (
                  <Fragment key={c.id}>
                    <span className="flex items-center gap-1.5 min-w-0 text-xs text-slate-700">
                      {c.status === 'pass' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                      ) : c.status === 'borderline' ? (
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden />
                      )}
                      <span className="truncate capitalize">{c.label}</span>
                      {c.scale && <span className="shrink-0 text-2xs text-slate-600">{c.scale}</span>}
                    </span>
                    <span
                      className={`text-right text-xs font-bold tabular
                        ${c.status === 'pass' ? 'text-emerald-700' : c.status === 'borderline' ? 'text-amber-700' : 'text-rose-700'}`}
                    >
                      {c.shortActual}
                    </span>
                    <span className="text-right text-xs tabular text-slate-600">{c.shortRequired}</span>
                  </Fragment>
                ))}
              </div>
              <p className="pt-1 text-2xs text-slate-600 leading-relaxed border-t border-slate-100">
                Computed live from the entry requirements on{' '}
                <Link to={`/courses/${course?.id}`} className="font-semibold text-royal-600 hover:underline">
                  {course?.code}
                </Link>
                . Editing those requirements updates this immediately.
              </p>
            </CardBody>
          </Card>

          {/* Scholarships */}
          <Card>
            <CardHeader title="Scholarship eligibility" icon={Award} />
            <CardBody className="space-y-2">
              {scholarshipMatches.map(({ scheme, result }) => (
                <div
                  key={scheme.id}
                  className={`rounded-lg border px-3 py-2.5 ${result.eligible ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-13 font-bold text-slate-900 truncate">{scheme.name}</p>
                      <p className="text-2xs text-slate-600">
                        {scheme.type === 'percentage' ? `${scheme.value}% of tuition` : currency(scheme.value, scheme.currency)}
                        {' · '}
                        {result.slotsLeft} of {scheme.slotsTotal} slots left
                      </p>
                    </div>
                    {result.alreadyAwarded ? (
                      <Badge tone="emerald" size="sm" icon={CheckCircle2}>Awarded</Badge>
                    ) : result.eligible ? (
                      <Badge tone="emerald" size="sm">Eligible</Badge>
                    ) : (
                      <Badge tone="slate" size="sm">Not eligible</Badge>
                    )}
                  </div>
                  {!result.eligible && result.reasons.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-2xs text-slate-600 flex items-start gap-1">
                          <span aria-hidden className="text-slate-500">·</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.eligible && !result.alreadyAwarded && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Award}
                      className="mt-2 w-full"
                      disabled={result.slotsLeft <= 0}
                      onClick={() => {
                        dispatch({ type: 'AWARD_SCHOLARSHIP', schemeId: scheme.id, applicantId: applicant.id });
                        toast(`${scheme.name} awarded to ${applicant.name}`, {
                          description: 'Slots and budget updated.',
                        });
                      }}
                    >
                      {result.slotsLeft <= 0 ? 'No slots remaining' : `Award ${scheme.name}`}
                    </Button>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Reviewer — one control, so no card header to go with it */}
          <Card>
            <CardBody className="flex items-center gap-3">
              <p className="micro-label shrink-0">Reviewer</p>
              <div className="flex-1 min-w-0">
              <Dropdown
                width={230}
                className="w-full"
                trigger={({ toggle, open }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={open}
                    aria-label="Change the assigned reviewer"
                    className="w-full flex items-center gap-2.5 rounded-lg border border-control px-2.5 py-1.5
                      text-left hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    {reviewer ? (
                      <>
                        <Avatar name={reviewer.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-13 font-semibold text-slate-800 truncate">{reviewer.name}</span>
                          <span className="block text-2xs text-slate-600 truncate">{reviewer.role}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="grid place-items-center h-7 w-7 rounded-full bg-slate-100 text-slate-500 shrink-0" aria-hidden>
                          <Users className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-13 font-semibold text-slate-500">Unassigned</span>
                      </>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden />
                  </button>
                )}
              >
                {({ close }) => (
                  <div>
                    <MenuLabel>Assign to</MenuLabel>
                    {state.reviewers.map((r) => (
                      <MenuItem
                        key={r.id}
                        onClick={() => {
                          dispatch({ type: 'ASSIGN_REVIEWER', ids: [applicant.id], reviewerId: r.id });
                          toast(`Assigned to ${r.name}`);
                          close();
                        }}
                      >
                        {r.name}
                        {r.id === CURRENT_USER.id && <span className="text-slate-500"> (you)</span>}
                      </MenuItem>
                    ))}
                    <MenuItem
                      tone="danger"
                      onClick={() => {
                        dispatch({ type: 'ASSIGN_REVIEWER', ids: [applicant.id], reviewerId: null });
                        toast('Reviewer removed', { tone: 'info' });
                        close();
                      }}
                    >
                      Unassign
                    </MenuItem>
                  </div>
                )}
              </Dropdown>
              </div>
            </CardBody>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader
              title="Internal notes"
              icon={Lock}
              description="Visible to admissions staff only — never shown to the applicant."
              action={<Badge tone="amber" size="sm" icon={Lock}>Staff only</Badge>}
            />
            <CardBody className="space-y-3">
              {applicant.notes.length === 0 ? (
                <p className="text-13 text-slate-500 py-2">No internal notes on this application yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {applicant.notes.map((n) => (
                    <li key={n.id} className="group rounded-lg bg-amber-50/70 border border-amber-200/70 px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <Avatar name={n.author} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-2xs">
                            <span className="font-bold text-slate-800">{n.author}</span>
                            <span className="text-slate-500"> · {n.role}</span>
                          </p>
                          <p className="mt-1 text-13 text-slate-700 leading-relaxed">{n.text}</p>
                          <p className="mt-1 text-2xs text-slate-600">{relativeTime(n.createdAt)}</p>
                        </div>
                        {n.authorId === CURRENT_USER.id && (
                          <button
                            type="button"
                            aria-label="Delete note"
                            onClick={() => dispatch({ type: 'DELETE_NOTE', id: applicant.id, noteId: n.id })}
                            className="shrink-0 h-6 w-6 grid place-items-center rounded text-amber-600/50
                              opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-amber-100 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <label htmlFor="new-note" className="sr-only">Add an internal note</label>
                <textarea
                  id="new-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addNote();
                  }}
                  rows={3}
                  maxLength={500}
                  placeholder="Add a note for the admissions team…"
                  className="textarea"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-2xs text-slate-600">⌘↵ to post · {note.length}/500</p>
                  <Button variant="primary" size="sm" icon={Send} disabled={!note.trim()} onClick={addNote}>
                    Add note
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <OfferLetterPreview
        open={!!offerPreview}
        onClose={() => setOfferPreview(null)}
        applicant={applicant}
        course={course}
        intake={intake}
        university={state.university}
        template={offerPreview?.template}
        onSend={sendOffer}
      />
    </div>
  );
}
