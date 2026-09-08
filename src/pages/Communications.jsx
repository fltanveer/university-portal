import { useMemo, useState } from 'react';
import {
  Check, ChevronRight, Copy, FileText, Inbox, MailCheck, Pencil, Plus, Search, Send, Users, Layers, Info,
} from 'lucide-react';
import { useStore, useLookups } from '../store/AppStore';
import { useRoute } from '../lib/router';
import { CURRENT_USER, STAGES, COUNTRIES, stageById } from '../data/mockData';
import { MERGE_FIELDS, resolveMergeFields, findUnresolved } from '../lib/merge';
import { formatDateTime, relativeTime } from '../lib/format';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { TextField, TextArea, Field } from '../components/ui/Field';
import { SearchInput, FilterSelect } from '../components/ui/FilterBar';
import { TableWrap, Checkbox } from '../components/ui/Table';

const TABS = [
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'templates', label: 'Template library', icon: FileText },
  { id: 'history', label: 'Sent history', icon: MailCheck },
];

export default function Communications({ tab: routeTab }) {
  const { state, dispatch, toast } = useStore();
  const { navigate } = useRoute();
  const tab = TABS.some((t) => t.id === routeTab) ? routeTab : 'compose';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Communications"
        description="Send offers, document requests and decisions using templates that merge real applicant data."
        meta={
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            Sending is simulated in this build — messages are logged to the history below, not delivered.
          </span>
        }
      />

      <Card>
        <Tabs
          className="px-2"
          active={tab}
          onChange={(id) => navigate(`/communications/${id}`)}
          tabs={TABS.map((t) =>
            t.id === 'history' ? { ...t, count: state.messages.length } : t.id === 'templates' ? { ...t, count: state.templates.length } : t
          )}
        />
        {tab === 'compose' && <Compose />}
        {tab === 'templates' && <TemplateLibrary />}
        {tab === 'history' && <SentHistory />}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Compose() {
  const { state, dispatch, toast } = useStore();
  const { courseById, intakeById } = useLookups();

  const [templateId, setTemplateId] = useState(state.templates[0]?.id ?? null);
  const [mode, setMode] = useState('segment'); // 'segment' | 'individual'
  const [stageFilter, setStageFilter] = useState([]);
  const [countryFilter, setCountryFilter] = useState([]);
  const [courseFilter, setCourseFilter] = useState([]);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const template = state.templates.find((t) => t.id === templateId);

  const segment = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.applicants.filter((a) => {
      if (stageFilter.length && !stageFilter.includes(a.stage)) return false;
      if (countryFilter.length && !countryFilter.includes(a.countryCode)) return false;
      if (courseFilter.length && !courseFilter.includes(a.courseId)) return false;
      if (term && !`${a.name} ${a.reference} ${a.email}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [state.applicants, stageFilter, countryFilter, courseFilter, search]);

  const recipients = mode === 'segment' ? segment : segment.filter((a) => picked.has(a.id));
  const first = recipients[0];

  const preview = useMemo(() => {
    if (!template || !first) return null;
    const ctx = {
      applicant: first,
      course: courseById[first.courseId],
      intake: intakeById[first.intakeId],
      university: state.university,
      officer: CURRENT_USER,
      scholarship: state.scholarships.find((s) => first.scholarshipAwards[0]?.schemeId === s.id),
    };
    const subject = resolveMergeFields(template.subject, ctx);
    const body = resolveMergeFields(template.body, ctx);
    return { subject, body, unresolved: [...new Set([...findUnresolved(subject), ...findUnresolved(body)])] };
  }, [template, first, courseById, intakeById, state.university, state.scholarships]);

  const send = () => {
    dispatch({
      type: 'SEND_MESSAGE',
      message: {
        templateId: template.id,
        templateName: template.name,
        subject: preview.subject,
        body: preview.body,
        recipients: recipients.map((a) => ({ id: a.id, name: a.name, email: a.email })),
      },
    });
    toast(`${template.name} sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`, {
      description: 'Logged to sent history. Each recipient timeline has been updated.',
    });
    setConfirmOpen(false);
    setPicked(new Set());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
      {/* Left: setup */}
      <div className="p-4 space-y-4">
        <div>
          <p className="micro-label mb-2">1 · Choose a template</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {state.templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors
                  ${t.id === templateId ? 'border-royal-500 bg-royal-50 ring-1 ring-royal-500' : 'border-control hover:border-control-hover hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-13 font-bold text-slate-900 truncate">{t.name}</span>
                  {t.id === templateId && <Check className="h-3.5 w-3.5 text-royal-600 shrink-0" aria-hidden />}
                </span>
                <span className="block text-2xs text-slate-600 mt-0.5">{t.category}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="micro-label mb-2">2 · Choose recipients</p>
          <div className="inline-flex rounded-lg border border-control p-0.5 mb-3">
            {[
              { id: 'segment', label: 'Filtered segment' },
              { id: 'individual', label: 'Pick individually' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1 rounded-md text-13 font-semibold transition-colors
                  ${mode === m.id ? 'bg-brand-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search applicants…" width="w-full sm:w-52" />
            <FilterSelect
              label="Stage"
              icon={Layers}
              options={STAGES.map((s) => ({ id: s.id, label: s.label, count: state.applicants.filter((a) => a.stage === s.id).length }))}
              value={stageFilter}
              onChange={setStageFilter}
            />
            <FilterSelect
              label="Country"
              options={COUNTRIES.map((c) => ({ id: c.code, label: `${c.flag}  ${c.name}`, count: state.applicants.filter((a) => a.countryCode === c.code).length }))}
              value={countryFilter}
              onChange={setCountryFilter}
            />
            <FilterSelect
              label="Course"
              width={300}
              searchable
              options={state.courses.map((c) => ({ id: c.id, label: c.title, count: state.applicants.filter((a) => a.courseId === c.id).length }))}
              value={courseFilter}
              onChange={setCourseFilter}
            />
          </div>

          <div className="rounded-lg border border-slate-200 max-h-72 overflow-y-auto scrollbar-thin">
            {segment.length === 0 ? (
              <EmptyState
                compact
                icon={Users}
                title="No applicants match this segment"
                description="Widen the filters or clear the search to find recipients."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {segment.slice(0, 60).map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 px-3 py-2">
                    {mode === 'individual' && (
                      <Checkbox
                        checked={picked.has(a.id)}
                        onChange={() => {
                          const next = new Set(picked);
                          next.has(a.id) ? next.delete(a.id) : next.add(a.id);
                          setPicked(next);
                        }}
                        label={`Select ${a.name}`}
                      />
                    )}
                    <Avatar name={a.name} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-13 font-semibold text-slate-800 truncate">{a.name}</span>
                      <span className="block text-2xs text-slate-600 truncate">{a.email}</span>
                    </span>
                    <Badge tone={stageById(a.stage).tone} size="sm">{stageById(a.stage).label}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            <span className="font-bold text-slate-800 tabular">{recipients.length}</span> recipient
            {recipients.length === 1 ? '' : 's'} selected
            {mode === 'segment' && segment.length > 0 && ' (everyone matching the filters above)'}
          </p>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="micro-label">3 · Preview</p>
          {first && (
            <p className="text-2xs text-slate-600">
              Merged for <span className="font-semibold text-slate-700">{first.name}</span>
              {recipients.length > 1 && ` (+${recipients.length - 1} more)`}
            </p>
          )}
        </div>

        {!template ? (
          <EmptyState compact icon={FileText} title="Choose a template" description="Pick a template on the left to see the merged preview." />
        ) : !first ? (
          <EmptyState
            compact
            icon={Users}
            title="No recipients selected"
            description="Select at least one applicant to preview the merged message."
          />
        ) : (
          <>
            {preview.unresolved.length > 0 && (
              <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <span className="font-bold">{preview.unresolved.length} merge field</span> could not be resolved for this
                recipient and is highlighted below.
              </div>
            )}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 space-y-0.5">
                <p className="text-2xs text-slate-600">
                  <span className="font-semibold text-slate-600">To</span> {first.name} &lt;{first.email}&gt;
                </p>
                <p className="text-13 font-bold text-slate-900">{preview.subject}</p>
              </div>
              <div className="px-3.5 py-3 max-h-[26rem] overflow-y-auto scrollbar-thin">
                <div className="whitespace-pre-wrap text-13 leading-[1.75] text-slate-700">
                  {preview.body.split(/(\[[a-z_]+ — not available\])/g).map((chunk, i) =>
                    /^\[[a-z_]+ — not available\]$/.test(chunk) ? (
                      <mark key={i} className="rounded bg-amber-100 px-1 font-semibold text-amber-900 ring-1 ring-amber-300">
                        {chunk}
                      </mark>
                    ) : (
                      <span key={i}>{chunk}</span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="primary"
                icon={Send}
                disabled={recipients.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Send to {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
              </Button>
              <p className="text-2xs text-slate-600">Each recipient gets their own merged copy.</p>
            </div>
          </>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="md"
        title={`Send “${template?.name}” to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Send} data-autofocus onClick={send}>
              Send now
            </Button>
          </>
        }
      >
        <p className="text-13 text-slate-600 leading-relaxed mb-3">
          Sending is simulated — nothing leaves this browser. The message is written to the sent history and an
          entry is appended to each recipient's activity timeline.
        </p>
        <div className="rounded-lg border border-slate-200 max-h-48 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
          {recipients.slice(0, 25).map((a) => (
            <p key={a.id} className="px-3 py-1.5 text-13 text-slate-700">
              {a.name} <span className="text-slate-500">&lt;{a.email}&gt;</span>
            </p>
          ))}
          {recipients.length > 25 && (
            <p className="px-3 py-1.5 text-2xs text-slate-600">…and {recipients.length - 25} more</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TemplateLibrary() {
  const { state, dispatch, toast } = useStore();
  const [editing, setEditing] = useState(null);

  return (
    <>
      <CardBody className="space-y-2">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-13 text-slate-600">
            Use <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-semibold text-accent-700">{'{{merge_fields}}'}</code>{' '}
            to pull real applicant data into any template.
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() =>
              setEditing({
                id: null,
                name: '',
                category: 'Custom',
                subject: '',
                body: 'Dear {{first_name}},\n\n\n\nKind regards,\n{{officer_name}}\nAdmissions Office, {{university}}',
              })
            }
          >
            New template
          </Button>
        </div>

        <ul className="space-y-2">
          {state.templates.map((t) => (
            <li key={t.id} className="rounded-lg border border-slate-200 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-13 font-bold text-slate-900">{t.name}</p>
                    <Badge tone="slate" size="sm">{t.category}</Badge>
                  </div>
                  <p className="mt-1 text-13 text-slate-600 truncate">{t.subject}</p>
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.body.slice(0, 180)}…
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...new Set(t.body.concat(t.subject).match(/\{\{[a-z_]+\}\}/g) || [])].map((f) => (
                      <code key={f} className="rounded bg-accent-50 px-1.5 py-0.5 text-2xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-200">
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(t)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Copy}
                    onClick={() => {
                      dispatch({ type: 'SAVE_TEMPLATE', template: { ...t, id: null, name: `${t.name} (copy)` } });
                      toast(`Duplicated “${t.name}”`);
                    }}
                  >
                    Duplicate
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>

      <TemplateEditor
        key={editing?.id ?? 'new'}
        template={editing}
        onClose={() => setEditing(null)}
        onSave={(t) => {
          dispatch({ type: 'SAVE_TEMPLATE', template: t });
          toast(t.id ? `“${t.name}” saved` : `“${t.name}” created`);
          setEditing(null);
        }}
      />
    </>
  );
}

function TemplateEditor({ template, onClose, onSave }) {
  const [draft, setDraft] = useState(template);
  if (!template || !draft) return null;

  const insert = (token, field) =>
    setDraft({ ...draft, [field]: `${draft[field]}${draft[field].endsWith(' ') || !draft[field] ? '' : ' '}${token}` });

  return (
    <Modal
      open={!!template}
      onClose={onClose}
      size="xl"
      title={template.id ? `Edit ${template.name}` : 'New template'}
      description="Merge fields resolve against each recipient when the message is composed."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()}
            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          >
            {template.id ? 'Save template' : 'Create template'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <TextField data-autofocus label="Template name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <TextField label="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        </div>
        <TextField label="Subject line" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
        <TextArea
          label="Message body"
          rows={14}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
        <Field label="Available merge fields" hint="Click to append to the message body.">
          <div className="flex flex-wrap gap-1.5">
            {MERGE_FIELDS.map((f) => (
              <button
                key={f.token}
                type="button"
                title={f.label}
                onClick={() => insert(f.token, 'body')}
                className="rounded-md bg-accent-50 px-1.5 py-1 text-2xs font-semibold text-accent-700
                  ring-1 ring-inset ring-accent-200 hover:bg-accent-100 transition-colors"
              >
                {f.token}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function SentHistory() {
  const { state } = useStore();
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');

  const messages = state.messages.filter(
    (m) =>
      !search.trim() ||
      `${m.subject} ${m.templateName} ${m.recipients.map((r) => r.name).join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
  );

  if (state.messages.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing sent yet"
        description="Messages you send from the Compose tab, or offer letters sent from an application, appear here."
      />
    );
  }

  return (
    <>
      <div className="p-3 border-b border-slate-200">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sent messages…" width="w-full sm:w-72" />
      </div>
      {messages.length === 0 ? (
        <EmptyState compact icon={Search} title="No messages match that search" />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th scope="col" className="th">Subject</th>
              <th scope="col" className="th">Template</th>
              <th scope="col" className="th">Recipients</th>
              <th scope="col" className="th">Sent by</th>
              <th scope="col" className="th text-right">Sent</th>
              <th scope="col" className="th text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {messages.map((m) => (
              <tr key={m.id} onClick={() => setOpen(m)} className="row-link">
                <td className="td max-w-[22rem]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(m);
                    }}
                    className="block w-full text-left font-semibold text-slate-900 truncate
                      hover:text-royal-700 transition-colors rounded"
                  >
                    {m.subject}
                  </button>
                </td>
                <td className="td text-slate-600 whitespace-nowrap">{m.templateName}</td>
                <td className="td">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex -space-x-1.5">
                      {m.recipients.slice(0, 3).map((r) => (
                        <Avatar key={r.id} name={r.name} size="xs" ring />
                      ))}
                    </span>
                    <span className="text-slate-600 tabular">
                      {m.recipients.length === 1 ? m.recipients[0].name : `${m.recipients.length} recipients`}
                    </span>
                  </span>
                </td>
                <td className="td text-slate-600 whitespace-nowrap">{m.sentBy}</td>
                <td className="td text-right text-slate-500 whitespace-nowrap tabular">{relativeTime(m.sentAt)}</td>
                <td className="td text-right">
                  <ChevronRight className="inline h-3.5 w-3.5 text-slate-300" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        size="lg"
        title={open?.subject ?? ''}
        description={open ? `${open.templateName} · sent by ${open.sentBy} · ${formatDateTime(open.sentAt)}` : ''}
      >
        {open && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
              <p className="micro-label mb-1.5">Recipients ({open.recipients.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {open.recipients.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 pl-0.5 pr-2 py-0.5">
                    <Avatar name={r.name} size="xs" />
                    <span className="text-2xs font-semibold text-slate-700">{r.name}</span>
                  </span>
                ))}
              </div>
            </div>
            {open.body ? (
              <div className="rounded-lg border border-slate-200 px-4 py-3.5 whitespace-pre-wrap text-13 leading-[1.75] text-slate-700">
                {open.body}
              </div>
            ) : (
              <p className="text-13 text-slate-500 italic">
                Message body was not retained for this record — it predates the current template version.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
