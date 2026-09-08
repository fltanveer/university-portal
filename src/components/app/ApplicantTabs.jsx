import { useState } from 'react';
import {
  Briefcase, Check, CheckCircle2, FileText, GraduationCap, Mail, MapPin, MessageSquareQuote, Phone,
  RotateCcw, ShieldAlert, Sparkles, Upload, User, X, XCircle, Award, CalendarDays, FileCheck2, Building2,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Avatar from '../ui/Avatar';
import { SelectField } from '../ui/Field';
import { DocStatusBadge } from './StatusPills';
import { DOC_REJECTION_REASONS, COUNTRIES } from '../../data/mockData';
import { formatDate, formatDateTime, fileSize, relativeTime, currency } from '../../lib/format';
import { ieltsEquivalent } from '../../lib/eligibility';

/** One field. `wide` spans the full grid for values that need the room. */
function Row({ label, children, wide = false, className = '' }) {
  return (
    <div className={`min-w-0 py-2 border-b border-slate-100 ${wide ? 'sm:col-span-2' : ''} ${className}`}>
      <dt className="micro-label">{label}</dt>
      <dd className="mt-1 text-13 text-slate-800 min-w-0">{children}</dd>
    </div>
  );
}

/** Fields sit two-up from `sm`, so a wide main column stops running to waste. */
function FieldGrid({ children, className = '' }) {
  return <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 ${className}`}>{children}</dl>;
}

function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <h3 className="flex items-center gap-1.5 text-13 font-bold text-slate-900">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />}
        {children}
      </h3>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function ProfileTab({ applicant, course, intake }) {
  const country = COUNTRIES.find((c) => c.code === applicant.countryCode);
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={User}>Personal details</SectionTitle>
        <FieldGrid>
          <Row label="Full name">{applicant.name}</Row>
          <Row label="Application ref">
            <span className="tabular font-semibold">{applicant.reference}</span>
          </Row>
          <Row label="Nationality">
            <span aria-hidden className="mr-1.5">{country?.flag}</span>
            {applicant.nationality}
          </Row>
          <Row label="Date of birth">
            {formatDate(applicant.dateOfBirth)} <span className="text-slate-500">· {applicant.age} years old</span>
          </Row>
          <Row label="Current city">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-slate-500" aria-hidden />
              {applicant.city}, {applicant.nationality}
            </span>
          </Row>
          <Row label="Email">
            <a href={`mailto:${applicant.email}`} className="inline-flex items-center gap-1.5 text-royal-700 hover:underline">
              <Mail className="h-3 w-3" aria-hidden />
              {applicant.email}
            </a>
          </Row>
          <Row label="Phone">
            <span className="inline-flex items-center gap-1.5 tabular">
              <Phone className="h-3 w-3 text-slate-500" aria-hidden />
              {applicant.phone}
            </span>
          </Row>
          <Row label="Source">{applicant.agent}</Row>
        </FieldGrid>
      </div>

      <div>
        <SectionTitle icon={GraduationCap}>Application</SectionTitle>
        <FieldGrid>
          <Row label="Course applied" wide>
            <p className="font-semibold text-slate-900">{course?.title}</p>
            <p className="text-xs text-slate-600">
              {course?.code} · {course?.faculty} · {course?.duration}
            </p>
          </Row>
          <Row label="Intake">{intake?.label ?? '—'}</Row>
          <Row label="Level sought">{applicant.degreeSought}</Row>
          <Row label="Annual tuition">
            {course ? currency(course.tuition, course.currency) : '—'}
          </Row>
          <Row label="Submitted">
            {formatDate(applicant.applicationDate)}{' '}
            <span className="text-slate-500">({relativeTime(applicant.applicationDate)})</span>
          </Row>
          {applicant.interviewDate && (
            <Row label="Interview">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-slate-500" aria-hidden />
                {formatDate(applicant.interviewDate)}
              </span>
            </Row>
          )}
        </FieldGrid>
      </div>

      <div>
        <SectionTitle icon={Briefcase}>Work experience</SectionTitle>
        {applicant.workHistory.length === 0 ? (
          <p className="text-13 text-slate-500 py-2">
            No professional experience declared. {applicant.degreeSought === 'Bachelor' ? 'Expected for a school leaver.' : ''}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {applicant.workHistory.map((job) => (
              <li key={job.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-slate-100 text-slate-500" aria-hidden>
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-13 font-semibold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-600">{job.employer}</p>
                  <p className="mt-1 text-2xs text-slate-600">
                    {formatDate(job.from)} — {job.to === 'Present' ? 'Present' : formatDate(job.to)} ·{' '}
                    <span className="font-semibold">{job.years} years</span>
                  </p>
                  <p className="mt-1.5 max-w-[72ch] text-xs text-slate-600 leading-relaxed">{job.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function CheckRow({ check }) {
  const meta = {
    pass: { icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Meets' },
    borderline: { icon: ShieldAlert, cls: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Borderline' },
    fail: { icon: XCircle, cls: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Below' },
  }[check.status];
  const Icon = meta.icon;

  return (
    <li className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${meta.bg}`}>
      <Icon className={`h-4 w-4 shrink-0 ${meta.cls}`} aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-13 font-semibold text-slate-900 capitalize">{check.label}</span>
        <span className="block text-2xs text-slate-600">
          Requires {check.requiredText}
          {check.status !== 'pass' && check.shortfall > 0 && (
            <span className="font-semibold"> · short by {check.shortfall}</span>
          )}
        </span>
      </span>
      <span className="text-right shrink-0">
        <span className={`block font-display text-base leading-none tabular ${meta.cls}`}>{check.actualText}</span>
        <span className="block text-2xs font-bold uppercase tracking-wide text-slate-600 mt-1">{meta.label}</span>
      </span>
    </li>
  );
}

export function AcademicsTab({ applicant, course, eligibility }) {
  const test = applicant.englishTest;
  const equiv = ieltsEquivalent(test);
  const academicChecks = eligibility.checks.filter((c) => c.id === 'gpa' || c.id === 'work' || c.id === 'prior_degree');
  const englishChecks = eligibility.checks.filter((c) => c.id.startsWith('english'));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={GraduationCap}>Academic record</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="micro-label">GPA (normalised)</p>
            <p className="font-display text-3xl text-brand-950 leading-none mt-1.5 tabular">
              {applicant.gpa.value.toFixed(2)}
              <span className="text-base text-slate-500"> / 4.0</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="micro-label">Original scale</p>
            <p className="font-display text-3xl text-brand-950 leading-none mt-1.5 tabular">
              {applicant.gpa.original.value}
              <span className="text-base text-slate-500"> / {applicant.gpa.original.scale}</span>
            </p>
            <p className="text-2xs text-slate-600 mt-1.5">{applicant.gpa.original.system}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="micro-label">Graduated</p>
            <p className="font-display text-3xl text-brand-950 leading-none mt-1.5 tabular">{applicant.gpa.graduationYear}</p>
          </div>
        </div>
        <FieldGrid>
          <Row label="Qualification" wide>{applicant.priorDegree}</Row>
          <Row label="Institution">{applicant.gpa.institution}</Row>
          <Row label="Transcript">
            {(() => {
              const doc = applicant.documents.find((d) => d.type === 'transcript');
              return doc ? (
                <span className="inline-flex items-center gap-2">
                  <FileCheck2 className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                  <span className="text-slate-700">{doc.fileName}</span>
                  <DocStatusBadge status={doc.status} size="sm" />
                </span>
              ) : (
                <span className="text-slate-500">Not uploaded</span>
              );
            })()}
          </Row>
        </FieldGrid>
        {academicChecks.length > 0 && (
          <ul className="mt-3 space-y-2">
            {academicChecks
              .filter((c) => c.id !== 'prior_degree')
              .map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
          </ul>
        )}
      </div>

      <div>
        <SectionTitle
          icon={Sparkles}
          action={
            <span className="text-2xs text-slate-600">
              Test taken {formatDate(test.testDate)} · Report {test.reportNumber}
            </span>
          }
        >
          English proficiency — {test.type}
        </SectionTitle>

        <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 mb-3">
          <div>
            <p className="micro-label">Overall</p>
            <p className="font-display text-3xl text-brand-950 leading-none mt-1 tabular">{test.overall}</p>
          </div>
          {test.type !== 'IELTS' && (
            <div className="pl-3 border-l border-slate-300">
              <p className="micro-label">IELTS equivalent</p>
              <p className="font-display text-2xl text-slate-600 leading-none mt-1 tabular">{equiv?.toFixed(1)}</p>
            </div>
          )}
          <p className="ml-auto max-w-xs text-2xs text-slate-600 leading-relaxed text-right">
            Course requires{' '}
            <span className="font-bold text-slate-700">
              {course?.requirements.minIelts} IELTS ({course?.requirements.minIeltsBand} per band)
            </span>{' '}
            or accepted equivalent.
          </p>
        </div>

        <p className="micro-label mb-2">Per-band breakdown against requirement</p>
        {englishChecks.length > 0 ? (
          <ul className="space-y-2">
            {englishChecks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </ul>
        ) : (
          <p className="text-13 text-slate-500">No band-level requirement is set for this test type on this course.</p>
        )}

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(test.bands).map(([band, score]) => (
            <div key={band} className="rounded-lg border border-slate-200 px-2.5 py-2">
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-600">{band}</p>
              <p className="font-display text-xl text-brand-950 leading-none mt-1 tabular">{score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function DocumentsTab({ applicant, onApprove, onReject, onRequestReplacement, onReset }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState(DOC_REJECTION_REASONS[0]);
  const [alsoRequest, setAlsoRequest] = useState(true);

  const approved = applicant.documents.filter((d) => d.status === 'approved').length;
  const rejected = applicant.documents.filter((d) => d.status === 'rejected').length;
  const pending = applicant.documents.filter((d) => d.status === 'pending').length;

  if (applicant.documents.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No documents uploaded"
        description="This applicant has not uploaded any supporting documents through StudyFound yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Badge tone="emerald" icon={CheckCircle2}>{approved} approved</Badge>
        <Badge tone="amber">{pending} pending review</Badge>
        {rejected > 0 && <Badge tone="rose" icon={XCircle}>{rejected} rejected</Badge>}
        <span className="ml-auto text-2xs text-slate-600">
          {applicant.documents.filter((d) => d.required).length} of these are mandatory
        </span>
      </div>

      <ul className="space-y-2">
        {applicant.documents.map((doc) => (
          <li
            key={doc.id}
            className={`rounded-lg border p-3 transition-colors
              ${doc.status === 'rejected' ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <span
                className={`grid place-items-center h-9 w-9 shrink-0 rounded-lg
                  ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}
                aria-hidden
              >
                <FileText className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-13 font-bold text-slate-900">{doc.name}</p>
                  {doc.required && <Badge tone="slate" size="sm">Required</Badge>}
                  <DocStatusBadge status={doc.status} size="sm" />
                  {doc.replacementRequested && (
                    <Badge tone="sky" size="sm" icon={Upload}>Replacement requested</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-2xs text-slate-600 tabular">
                  {doc.fileName} · {fileSize(doc.sizeKb)} · uploaded {formatDate(doc.uploadedDate)}
                </p>
                {doc.reviewedBy && (
                  <p className="mt-0.5 text-2xs text-slate-600">
                    Reviewed by {doc.reviewedBy} · {relativeTime(doc.reviewedAt)}
                  </p>
                )}
                {doc.rejectionReason && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-rose-800">
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden />
                    {doc.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {doc.status === 'rejected' && !doc.replacementRequested && (
                  <Button variant="primary" size="sm" icon={Upload} onClick={() => onRequestReplacement(doc)}>
                    Request replacement
                  </Button>
                )}
                {doc.status !== 'approved' && (
                  <Button variant="success" size="sm" icon={Check} onClick={() => onApprove(doc)}>
                    Approve
                  </Button>
                )}
                {doc.status !== 'rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => {
                      setRejecting(doc);
                      setReason(DOC_REJECTION_REASONS[0]);
                      setAlsoRequest(true);
                    }}
                  >
                    Reject
                  </Button>
                )}
                {doc.status !== 'pending' && (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Reset ${doc.name} to pending`}
                    title="Reset to pending"
                    onClick={() => onReset(doc)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        size="md"
        title={`Reject “${rejecting?.name}”?`}
        description="A reason is required — it is shown to the applicant when you request a replacement."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              variant="dangerSolid"
              onClick={() => {
                onReject(rejecting, reason, alsoRequest);
                setRejecting(null);
              }}
            >
              {alsoRequest ? 'Reject & request replacement' : 'Reject document'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField
            label="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={DOC_REJECTION_REASONS.map((r) => ({ value: r, label: r }))}
          />
          <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alsoRequest}
              onChange={(e) => setAlsoRequest(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded-[4px] border-control text-royal-600"
            />
            <span>
              <span className="block text-13 font-semibold text-slate-800">Request a replacement immediately</span>
              <span className="block text-xs text-slate-600 leading-relaxed">
                Flags the document as awaiting re-upload in the applicant's StudyFound account.
              </span>
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function SopTab({ applicant }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={MessageSquareQuote}>Statement of purpose</SectionTitle>
        <blockquote className="rounded-lg border-l-[3px] border-accent-400 bg-slate-50 px-4 py-3.5">
          <p className="max-w-[68ch] text-sm leading-[1.8] text-slate-700 text-pretty">{applicant.sop}</p>
          <footer className="mt-3 pt-2.5 border-t border-slate-200 text-2xs text-slate-600">
            Excerpt from the full statement submitted with the application ·{' '}
            {applicant.documents.find((d) => d.type === 'sop')?.fileName ?? 'no file attached'}
          </footer>
        </blockquote>
      </div>

      <div>
        <SectionTitle icon={Award}>
          Reference letters
          <span className="ml-1.5 font-normal text-slate-500">({applicant.references.length})</span>
        </SectionTitle>
        <ul className="space-y-2.5">
          {applicant.references.map((ref) => (
            <li key={ref.id} className="rounded-lg border border-slate-200 p-3.5">
              <div className="flex items-start gap-3">
                <Avatar name={ref.name.replace(/^(Professor|Associate Professor|Dr|Senior Manager|Head of Department|Principal Engineer)\s/, '')} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-13 font-bold text-slate-900">{ref.name}</p>
                    {ref.verified ? (
                      <Badge tone="emerald" size="sm" icon={CheckCircle2}>Verified</Badge>
                    ) : (
                      <Badge tone="amber" size="sm" icon={ShieldAlert}>Awaiting verification</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {ref.title} · {ref.institution}
                  </p>
                  <p className="text-2xs text-slate-600 mt-0.5">
                    {ref.relationship} · submitted {formatDate(ref.submittedDate)}
                  </p>
                  <p className="mt-2.5 max-w-[72ch] text-13 leading-relaxed text-slate-700 text-pretty">“{ref.excerpt}”</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
const EVENT_META = {
  submitted: { icon: FileText, tone: 'bg-royal-100 text-royal-700' },
  documents: { icon: Upload, tone: 'bg-slate-100 text-slate-600' },
  document: { icon: FileCheck2, tone: 'bg-slate-100 text-slate-600' },
  assignment: { icon: User, tone: 'bg-slate-100 text-slate-600' },
  stage: { icon: CheckCircle2, tone: 'bg-accent-100 text-accent-700' },
  note: { icon: MessageSquareQuote, tone: 'bg-amber-100 text-amber-700' },
  email: { icon: Mail, tone: 'bg-sky-100 text-sky-700' },
  scholarship: { icon: Award, tone: 'bg-emerald-100 text-emerald-700' },
  action: { icon: Check, tone: 'bg-slate-100 text-slate-600' },
};

export function TimelineTab({ applicant }) {
  const events = [...applicant.timeline].sort((a, b) => new Date(b.at) - new Date(a.at));
  if (!events.length) {
    return <EmptyState icon={FileText} title="No activity recorded" description="Actions on this application will appear here." />;
  }
  return (
    <ol className="relative">
      <span className="absolute left-[0.9375rem] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
      {events.map((e) => {
        const meta = EVENT_META[e.type] || EVENT_META.action;
        const Icon = meta.icon;
        return (
          <li key={e.id} className="relative flex gap-3 py-2.5">
            <span className={`relative z-10 grid place-items-center h-8 w-8 shrink-0 rounded-full ring-4 ring-white ${meta.tone}`} aria-hidden>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-13 text-slate-800 leading-snug">{e.text}</p>
              <p className="mt-0.5 text-2xs text-slate-600">
                <span className="font-semibold text-slate-600">{e.actor}</span>
                {e.actorType === 'student' && <span className="text-slate-500"> (applicant)</span>}
                {e.actorType === 'system' && <span className="text-slate-500"> (automated)</span>}
                {' · '}
                <time dateTime={e.at} title={formatDateTime(e.at)}>{formatDateTime(e.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
