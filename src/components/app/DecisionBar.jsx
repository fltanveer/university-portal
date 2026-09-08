import { useState } from 'react';
import {
  Award, CalendarCheck, FileWarning, Star, ThumbsDown, PauseCircle, Clock4, CheckCircle2, ChevronDown,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Dropdown, { MenuItem, MenuLabel } from '../ui/Dropdown';
import { TextArea, TextField, SelectField } from '../ui/Field';
import { stageById } from '../../data/mockData';

const PRIMARY = [
  { id: 'shortlisted', label: 'Shortlist', doneLabel: 'Shortlisted', icon: Star, variant: 'secondary' },
  { id: 'documents_requested', label: 'Request documents', doneLabel: 'Documents requested', icon: FileWarning, variant: 'secondary' },
  { id: 'interview', label: 'Schedule interview', doneLabel: 'Interview scheduled', icon: CalendarCheck, variant: 'secondary' },
];

const SECONDARY = [
  { id: 'waitlisted', label: 'Waitlist', icon: PauseCircle },
  { id: 'deferred', label: 'Defer to next intake', icon: Clock4 },
  { id: 'rejected', label: 'Reject application', icon: ThumbsDown, tone: 'danger' },
];

const REJECT_REASONS = [
  'Does not meet minimum academic requirements',
  'Does not meet English language requirements',
  'Intake is full',
  'Insufficient or unverifiable documentation',
  'Not competitive against the applicant pool',
  'Applicant withdrew',
];

/**
 * Every action here is terminal enough to warrant a confirmation step that
 * captures *why*, because the reason is what ends up on the timeline and in the
 * letter the student receives.
 */
export default function DecisionBar({ applicant, onDecision, onOffer }) {
  const [modal, setModal] = useState(null); // 'conditional' | 'interview' | 'reject' | 'documents'
  const [conditions, setConditions] = useState(
    applicant.offerConditions ||
      'Provision of the final academic transcript confirming completion of the qualification with an overall GPA no lower than the interim result submitted.'
  );
  const [interviewDate, setInterviewDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState('');
  const [docNote, setDocNote] = useState('Certified academic transcript and a clear scan of the passport biographical page.');

  const current = applicant.stage;
  const close = () => setModal(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {PRIMARY.map((a) => (
          <Button
            key={a.id}
            variant={a.variant}
            size="sm"
            icon={a.icon}
            disabled={current === a.id}
            onClick={() => {
              if (a.id === 'interview') setModal('interview');
              else if (a.id === 'documents_requested') setModal('documents');
              else onDecision({ stage: a.id, note: `Application shortlisted for further assessment` });
            }}
          >
            {current === a.id ? a.doneLabel : a.label}
          </Button>
        ))}

        <span className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" aria-hidden />

        <Button variant="accent" size="sm" icon={Award} onClick={() => setModal('conditional')}>
          Conditional offer
        </Button>
        <Button
          variant="success"
          size="sm"
          icon={CheckCircle2}
          onClick={() => onOffer({ stage: 'offer_unconditional', templateId: 'tpl_offer' })}
        >
          Unconditional offer
        </Button>

        <Dropdown
          align="right"
          width={230}
          trigger={({ toggle, open }) => (
            <Button variant="secondary" size="sm" onClick={toggle} iconRight={ChevronDown} aria-expanded={open}>
              More
            </Button>
          )}
        >
          {({ close: closeMenu }) => (
            <div>
              <MenuLabel>Other outcomes</MenuLabel>
              {SECONDARY.map((a) => (
                <MenuItem
                  key={a.id}
                  icon={a.icon}
                  tone={a.tone}
                  disabled={current === a.id}
                  onClick={() => {
                    closeMenu();
                    if (a.id === 'rejected') setModal('reject');
                    else
                      onDecision({
                        stage: a.id,
                        note: `Application ${a.id === 'waitlisted' ? 'placed on the waitlist' : 'deferred to a later intake'}`,
                      });
                  }}
                >
                  {a.label}
                </MenuItem>
              ))}
              <MenuLabel>Post-offer</MenuLabel>
              <MenuItem
                icon={CheckCircle2}
                disabled={current === 'accepted' || current === 'deposit_paid'}
                onClick={() => {
                  closeMenu();
                  onDecision({ stage: 'accepted', note: 'Offer acceptance recorded' });
                }}
              >
                Record offer acceptance
              </MenuItem>
              <MenuItem
                icon={CheckCircle2}
                disabled={current === 'deposit_paid'}
                onClick={() => {
                  closeMenu();
                  onDecision({ stage: 'deposit_paid', note: 'Tuition deposit received and confirmed' });
                }}
              >
                Record deposit paid
              </MenuItem>
            </div>
          )}
        </Dropdown>
      </div>

      {/* Conditional offer */}
      <Modal
        open={modal === 'conditional'}
        onClose={close}
        size="lg"
        title="Issue a conditional offer"
        description="Write the conditions the applicant must satisfy before the offer becomes unconditional. These appear verbatim in the offer letter."
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button
              variant="accent"
              disabled={!conditions.trim()}
              onClick={() => {
                close();
                onOffer({ stage: 'offer_conditional', templateId: 'tpl_conditional', conditions: conditions.trim() });
              }}
            >
              Set conditions &amp; preview letter
            </Button>
          </>
        }
      >
        <TextArea
          data-autofocus
          label="Conditions of offer"
          hint="Write one condition per line. Be specific about evidence and deadlines — vague conditions create disputes at enrolment."
          rows={7}
          maxLength={1200}
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
        />
      </Modal>

      {/* Interview */}
      <Modal
        open={modal === 'interview'}
        onClose={close}
        size="sm"
        title="Schedule an interview"
        description="Moves the application to the Interview stage and records the proposed date."
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                close();
                onDecision({
                  stage: 'interview',
                  interviewDate: new Date(interviewDate).toISOString(),
                  note: `Interview scheduled for ${new Date(interviewDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                });
              }}
            >
              Schedule interview
            </Button>
          </>
        }
      >
        <TextField
          data-autofocus
          type="date"
          label="Interview date"
          hint="The applicant receives a scheduling link for a 30-minute video call."
          value={interviewDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setInterviewDate(e.target.value)}
        />
      </Modal>

      {/* Document request */}
      <Modal
        open={modal === 'documents'}
        onClose={close}
        size="lg"
        title="Request further documents"
        description="Moves the application to Docs Requested and records what was asked for."
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!docNote.trim()}
              onClick={() => {
                close();
                onDecision({ stage: 'documents_requested', note: `Documents requested: ${docNote.trim()}` });
              }}
            >
              Request documents
            </Button>
          </>
        }
      >
        <TextArea
          data-autofocus
          label="What is required?"
          hint="This text is recorded on the timeline. Send the formal request from Communications using the Document Request template."
          rows={4}
          maxLength={600}
          value={docNote}
          onChange={(e) => setDocNote(e.target.value)}
        />
      </Modal>

      {/* Reject */}
      <Modal
        open={modal === 'reject'}
        onClose={close}
        size="lg"
        title={`Reject ${applicant.name}'s application?`}
        description={`This moves the application out of ${stageById(current).label} and records the reason on the timeline.`}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button
              variant="dangerSolid"
              onClick={() => {
                close();
                onDecision({
                  stage: 'rejected',
                  note: `Application rejected — ${rejectReason}${rejectNote.trim() ? `. ${rejectNote.trim()}` : ''}`,
                });
              }}
            >
              Reject application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-13 text-rose-900 leading-relaxed">
            Rejection is recorded immediately and is visible to everyone on the admissions team. The student is
            <span className="font-semibold"> not </span>
            notified until you send them the outcome letter from Communications.
          </div>
          <SelectField
            label="Primary reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            options={REJECT_REASONS.map((r) => ({ value: r, label: r }))}
          />
          <TextArea
            label="Internal detail"
            optional
            hint="Staff-only context. Not included in any letter to the student."
            rows={3}
            maxLength={400}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
