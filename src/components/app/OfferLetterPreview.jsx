import { Mail, Printer, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { resolveMergeFields, findUnresolved } from '../../lib/merge';
import { CURRENT_USER } from '../../data/mockData';
import { formatDate } from '../../lib/format';

/**
 * Generated the moment an offer decision is taken. Merge fields resolve against
 * the real applicant record, and anything that cannot resolve is shown as a
 * visible marker rather than silently blanked.
 */
export default function OfferLetterPreview({ open, onClose, applicant, course, intake, university, template, onSend, scholarship }) {
  if (!applicant || !template) return null;

  const ctx = { applicant, course, intake, university, officer: CURRENT_USER, scholarship };
  const subject = resolveMergeFields(template.subject, ctx);
  const body = resolveMergeFields(template.body, ctx);
  const unresolved = findUnresolved(body).concat(findUnresolved(subject));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`${template.name} — preview`}
      description="Merge fields have been filled from this applicant's record. Review before sending."
      footer={
        <>
          <Button variant="ghost" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close without sending
          </Button>
          <Button variant="primary" icon={Mail} data-autofocus onClick={() => onSend({ subject, body })}>
            Send to {applicant.firstName}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {unresolved.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-px" aria-hidden />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">{unresolved.length} merge field{unresolved.length > 1 ? 's' : ''} could not be resolved.</p>
              <p>They are marked inline below. Fill the missing record data before sending, or edit the template.</p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-13">
          <dt className="micro-label pt-0.5">To</dt>
          <dd className="text-slate-800 font-medium">
            {applicant.name} <span className="text-slate-500">&lt;{applicant.email}&gt;</span>
          </dd>
          <dt className="micro-label pt-0.5">From</dt>
          <dd className="text-slate-800 font-medium">
            {CURRENT_USER.name} <span className="text-slate-500">&lt;{CURRENT_USER.email}&gt;</span>
          </dd>
          <dt className="micro-label pt-0.5">Subject</dt>
          <dd className="text-slate-900 font-bold">{subject}</dd>
        </dl>

        <article className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-xs">
          <header className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-900 text-white font-display text-13" aria-hidden>
                {university.logoText}
              </span>
              <div>
                <p className="font-display text-sm text-brand-950 leading-none">{university.name.toUpperCase()}</p>
                <p className="text-2xs text-slate-600 mt-1">
                  {university.location.city}, {university.location.state} · {university.website}
                </p>
              </div>
            </div>
            <div className="text-right text-2xs text-slate-600 shrink-0">
              <p className="font-bold text-slate-700 tabular">{applicant.reference}</p>
              <p>{formatDate(new Date())}</p>
            </div>
          </header>

          <div className="whitespace-pre-wrap text-13 leading-[1.75] text-slate-700 font-sans">
            {body.split(/(\[[a-z_]+ — not available\])/g).map((chunk, i) =>
              /^\[[a-z_]+ — not available\]$/.test(chunk) ? (
                <mark key={i} className="rounded bg-amber-100 px-1 font-semibold text-amber-900 ring-1 ring-amber-300">
                  {chunk}
                </mark>
              ) : (
                <span key={i}>{chunk}</span>
              )
            )}
          </div>

          <footer className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <p className="text-2xs text-slate-600">
              CRICOS provider · This letter is generated from the {template.name} template.
            </p>
            <Badge tone="slate" size="sm">Preview — not yet sent</Badge>
          </footer>
        </article>
      </div>
    </Modal>
  );
}
