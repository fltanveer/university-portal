import { useState } from 'react';
import { Award, Download, Pencil, Plus, Search, Trash2, Users, X, Percent, CircleDollarSign, Info } from 'lucide-react';
import { useStore, useLookups } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { COUNTRIES, FACULTIES } from '../data/mockData';
import { evaluateScholarship } from '../lib/eligibility';
import { currency, formatDate, daysBetween, number } from '../lib/format';
import { exportCsv } from '../lib/csv';
import PageHeader from '../components/layout/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Progress from '../components/ui/Progress';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TextField, TextArea, SelectField, Toggle, Field } from '../components/ui/Field';
import { SearchInput } from '../components/ui/FilterBar';
import { TableWrap } from '../components/ui/Table';

const BLANK_SCHEME = {
  name: '',
  type: 'fixed',
  value: 5000,
  currency: 'AUD',
  slotsTotal: 10,
  budgetCap: 50000,
  deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
  active: true,
  description: '',
  criteria: { minGpa: 3.0, countries: [], courseIds: [], faculties: [], needBased: false, minEnglishIelts: 6.0, levels: [] },
};

function schemeStatus(scheme) {
  const awarded = scheme.awards.filter((a) => a.status === 'awarded').length;
  const days = daysBetween(new Date().toISOString(), scheme.deadline);
  if (!scheme.active) return { label: 'Inactive', tone: 'slate' };
  if (awarded >= scheme.slotsTotal) return { label: 'Fully awarded', tone: 'rose' };
  if (days < 0) return { label: 'Closed', tone: 'slate' };
  if (days <= 21) return { label: 'Closing soon', tone: 'amber' };
  return { label: 'Open', tone: 'emerald' };
}

export default function Scholarships({ schemeId }) {
  const { state, dispatch, toast } = useStore();
  const { navigate } = useRoute();
  const { courseById } = useLookups();
  const [editing, setEditing] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [tab, setTab] = useState('eligible');
  const [search, setSearch] = useState('');

  const scheme = schemeId ? state.scholarships.find((s) => s.id === schemeId) : null;

  // ------------------------------------------------------------------ list
  if (!scheme) {
    const totalBudget = state.scholarships.reduce((s, x) => s + x.budgetCap, 0);
    const usedBudget = state.scholarships.reduce((s, x) => s + x.budgetUsed, 0);

    return (
      <div className="space-y-4">
        <PageHeader
          title="Scholarships"
          description="Schemes you fund, who has been awarded, and who is eligible but not yet awarded."
          meta={
            <>
              <span className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 tabular">{currency(usedBudget)}</span> of{' '}
                <span className="tabular">{currency(totalBudget)}</span> committed
              </span>
              <span className="h-3 w-px bg-slate-300" aria-hidden />
              <span className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 tabular">
                  {state.scholarships.reduce((s, x) => s + x.awards.filter((a) => a.status === 'awarded').length, 0)}
                </span>{' '}
                awards made
              </span>
            </>
          }
          actions={
            <Button variant="primary" icon={Plus} onClick={() => setEditing({ ...BLANK_SCHEME, id: null })}>
              New scheme
            </Button>
          }
        />

        {state.scholarships.length === 0 ? (
          <Card>
            <EmptyState
              icon={Award}
              title="No scholarship schemes"
              description="Create a scheme to start matching it against your applicant pool automatically."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setEditing({ ...BLANK_SCHEME, id: null })}>
                  Create the first scheme
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.scholarships.map((s) => {
              const awarded = s.awards.filter((a) => a.status === 'awarded').length;
              const status = schemeStatus(s);
              const days = daysBetween(new Date().toISOString(), s.deadline);
              return (
                <Card key={s.id} className="flex flex-col">
                  <CardHeader
                    title={s.name}
                    icon={s.type === 'percentage' ? Percent : CircleDollarSign}
                    action={<Badge tone={status.tone}>{status.label}</Badge>}
                    description={s.description}
                  />
                  <CardBody className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="micro-label">Value</p>
                        <p className="font-display text-2xl text-brand-950 leading-none mt-1 tabular">
                          {s.type === 'percentage' ? `${s.value}%` : currency(s.value, s.currency, true)}
                        </p>
                        <p className="text-2xs text-slate-600 mt-1">{s.type === 'percentage' ? 'of tuition' : 'one-off credit'}</p>
                      </div>
                      <div>
                        <p className="micro-label">Slots</p>
                        <p className="font-display text-2xl text-brand-950 leading-none mt-1 tabular">
                          {awarded}
                          <span className="text-base text-slate-500"> / {s.slotsTotal}</span>
                        </p>
                        <p className="text-2xs text-slate-600 mt-1">{s.slotsTotal - awarded} remaining</p>
                      </div>
                      <div>
                        <p className="micro-label">Deadline</p>
                        <p className="font-display text-2xl text-brand-950 leading-none mt-1 tabular">
                          {days >= 0 ? days : 0}
                        </p>
                        <p className="text-2xs text-slate-600 mt-1">{days >= 0 ? 'days left' : 'closed'}</p>
                      </div>
                    </div>
                    <Progress value={s.budgetUsed} max={s.budgetCap} tone="auto" showValue
                      label={`${currency(s.budgetUsed, s.currency)} of ${currency(s.budgetCap, s.currency)} budget used`} />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge tone="slate" size="sm">Min GPA {s.criteria.minGpa.toFixed(1)}</Badge>
                      {s.criteria.minEnglishIelts && <Badge tone="slate" size="sm">IELTS {s.criteria.minEnglishIelts.toFixed(1)}+</Badge>}
                      {s.criteria.countries.length > 0 && (
                        <Badge tone="slate" size="sm">
                          {s.criteria.countries.map((c) => COUNTRIES.find((x) => x.code === c)?.flag).join(' ')}
                        </Badge>
                      )}
                      {s.criteria.faculties?.length > 0 && <Badge tone="slate" size="sm">{s.criteria.faculties.join(', ')}</Badge>}
                      {s.criteria.gender === 'f' && <Badge tone="accent" size="sm">Women only</Badge>}
                      {s.criteria.needBased && <Badge tone="sky" size="sm">Need-based</Badge>}
                    </div>
                  </CardBody>
                  <CardFooter className="flex items-center gap-2">
                    <Button variant="primary" size="sm" icon={Users} onClick={() => navigate(`/scholarships/${s.id}`)}>
                      Manage &amp; award
                    </Button>
                    <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(s)}>
                      Edit
                    </Button>
                    <span className="ml-auto text-2xs text-slate-600 tabular">Closes {formatDate(s.deadline)}</span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <SchemeEditor
          key={editing?.id ?? 'new'}
          scheme={editing}
          courses={state.courses}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            dispatch({ type: 'SAVE_SCHEME', scheme: s });
            toast(s.id ? `“${s.name}” updated` : `“${s.name}” created`);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------- detail
  const awarded = scheme.awards.filter((a) => a.status === 'awarded');
  const slotsLeft = scheme.slotsTotal - awarded.length;
  const status = schemeStatus(scheme);

  const matches = state.applicants
    .map((a) => ({ applicant: a, result: evaluateScholarship(a, scheme, courseById[a.courseId]) }))
    .filter((m) => m.result.eligible && !m.result.alreadyAwarded)
    .filter((m) => !search.trim() || m.applicant.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.applicant.gpa.value - a.applicant.gpa.value);

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[{ label: 'Scholarships', to: '/scholarships' }, { label: scheme.name }]}
        title={scheme.name}
        description={scheme.description}
        meta={
          <>
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className="text-xs text-slate-600 tabular">
              {scheme.type === 'percentage' ? `${scheme.value}% of tuition` : currency(scheme.value, scheme.currency)}
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            <span className="text-xs text-slate-600 tabular">Closes {formatDate(scheme.deadline)}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(scheme)}>
              Edit scheme
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => {
                const count = exportCsv(
                  `${scheme.name.toLowerCase().replace(/\s+/g, '-')}-awards`,
                  [
                    { label: 'Student', get: (a) => a.applicantName },
                    { label: 'Amount (AUD)', get: (a) => a.amount },
                    { label: 'Awarded by', get: (a) => a.awardedBy },
                    { label: 'Awarded on', get: (a) => formatDate(a.awardedAt) },
                  ],
                  awarded
                );
                toast(`Exported ${count} awards to CSV`);
              }}
            >
              Export awards
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="micro-label">Slots awarded</p>
          <p className="font-display text-4xl text-brand-950 leading-none mt-1.5 tabular">
            {awarded.length}
            <span className="text-lg text-slate-500"> / {scheme.slotsTotal}</span>
          </p>
          <Progress className="mt-2" value={awarded.length} max={scheme.slotsTotal} tone="auto" size="sm" />
        </div>
        <div className="card p-3">
          <p className="micro-label">Budget committed</p>
          <p className="font-display text-4xl text-brand-950 leading-none mt-1.5 tabular">
            {currency(scheme.budgetUsed, scheme.currency, true)}
          </p>
          <Progress className="mt-2" value={scheme.budgetUsed} max={scheme.budgetCap} tone="auto" size="sm" />
        </div>
        <div className="card p-3">
          <p className="micro-label">Eligible, not awarded</p>
          <p className="font-display text-4xl text-brand-950 leading-none mt-1.5 tabular">{matches.length}</p>
          <p className="text-2xs text-slate-600 mt-2">Auto-matched from the applicant pool</p>
        </div>
        <div className="card p-3">
          <p className="micro-label">Slots remaining</p>
          <p className={`font-display text-4xl leading-none mt-1.5 tabular ${slotsLeft === 0 ? 'text-rose-700' : 'text-brand-950'}`}>
            {slotsLeft}
          </p>
          <p className="text-2xs text-slate-600 mt-2">
            {slotsLeft === 0 ? 'Scheme fully allocated' : `Budget left ${currency(scheme.budgetCap - scheme.budgetUsed, scheme.currency)}`}
          </p>
        </div>
      </div>

      <Card>
        <Tabs
          className="px-2"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'eligible', label: 'Eligible applicants', icon: Users, count: matches.length },
            { id: 'awarded', label: 'Awarded', icon: Award, count: awarded.length },
            { id: 'criteria', label: 'Criteria', icon: Info },
          ]}
        />

        {tab === 'eligible' && (
          <>
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Search eligible applicants…" width="w-full sm:w-72" />
              {slotsLeft === 0 && (
                <p className="text-xs font-semibold text-rose-700">All {scheme.slotsTotal} slots are allocated — revoke an award to free one.</p>
              )}
            </div>
            {matches.length === 0 ? (
              <EmptyState
                icon={Users}
                title={search ? 'No eligible applicants match that search' : 'No applicants currently match this scheme'}
                description={
                  search
                    ? 'Clear the search to see everyone who qualifies.'
                    : 'Loosen the criteria on this scheme, or wait for more applications to arrive.'
                }
                action={
                  search ? (
                    <Button variant="secondary" icon={X} onClick={() => setSearch('')}>Clear search</Button>
                  ) : (
                    <Button variant="secondary" icon={Pencil} onClick={() => setEditing(scheme)}>Edit criteria</Button>
                  )
                }
              />
            ) : (
              <TableWrap>
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="th">Student</th>
                    <th scope="col" className="th">Course</th>
                    <th scope="col" className="th">Country</th>
                    <th scope="col" className="th text-right">GPA</th>
                    <th scope="col" className="th text-right">English</th>
                    <th scope="col" className="th text-right">Award value</th>
                    <th scope="col" className="th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matches.map(({ applicant: a }) => {
                    const course = courseById[a.courseId];
                    const amount = scheme.type === 'percentage' ? Math.round((course?.tuition ?? 0) * scheme.value / 100) : scheme.value;
                    const overBudget = scheme.budgetUsed + amount > scheme.budgetCap;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="td">
                          <Link to={`/applications/${a.id}`} className="flex items-center gap-2.5 group">
                            <Avatar name={a.name} size="sm" />
                            <span className="min-w-0">
                              <span className="block font-semibold text-slate-900 truncate group-hover:text-royal-700 transition-colors">
                                {a.name}
                              </span>
                              <span className="block text-2xs text-slate-600 tabular">{a.reference}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="td max-w-[16rem] truncate text-slate-600">{course?.title}</td>
                        <td className="td whitespace-nowrap">
                          <span className="mr-1.5" aria-hidden>{COUNTRIES.find((c) => c.code === a.countryCode)?.flag}</span>
                          {a.nationality}
                        </td>
                        <td className="td text-right tabular font-semibold">{a.gpa.value.toFixed(2)}</td>
                        <td className="td text-right tabular text-slate-600">{a.englishTest.type} {a.englishTest.overall}</td>
                        <td className="td text-right tabular font-semibold">{currency(amount, scheme.currency)}</td>
                        <td className="td text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Award}
                            disabled={slotsLeft <= 0}
                            title={overBudget ? 'This award exceeds the remaining budget cap' : undefined}
                            onClick={() => {
                              dispatch({ type: 'AWARD_SCHOLARSHIP', schemeId: scheme.id, applicantId: a.id });
                              toast(`${scheme.name} awarded to ${a.name}`, {
                                description: `${currency(amount, scheme.currency)} committed · ${slotsLeft - 1} slots left`,
                                tone: overBudget ? 'warning' : 'success',
                              });
                            }}
                          >
                            Award
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}
          </>
        )}

        {tab === 'awarded' && (
          <>
            {awarded.length === 0 ? (
              <EmptyState icon={Award} title="No awards made yet" description="Award this scholarship from the Eligible applicants tab." />
            ) : (
              <TableWrap>
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="th">Student</th>
                    <th scope="col" className="th text-right">Amount</th>
                    <th scope="col" className="th">Awarded by</th>
                    <th scope="col" className="th">Date</th>
                    <th scope="col" className="th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {awarded.map((aw) => (
                    <tr key={aw.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="td">
                        <Link to={`/applications/${aw.applicantId}`} className="flex items-center gap-2.5 group">
                          <Avatar name={aw.applicantName} size="sm" />
                          <span className="font-semibold text-slate-900 group-hover:text-royal-700 transition-colors">
                            {aw.applicantName}
                          </span>
                        </Link>
                      </td>
                      <td className="td text-right tabular font-semibold">{currency(aw.amount, scheme.currency)}</td>
                      <td className="td text-slate-600">{aw.awardedBy}</td>
                      <td className="td text-slate-500 tabular">{formatDate(aw.awardedAt)}</td>
                      <td className="td text-right">
                        <Button variant="danger" size="sm" icon={Trash2} onClick={() => setRevoking(aw)}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </>
        )}

        {tab === 'criteria' && (
          <CardBody>
            <dl className="max-w-xl space-y-2.5">
              {[
                ['Minimum GPA', `${scheme.criteria.minGpa.toFixed(2)} / 4.0`],
                ['Minimum English', scheme.criteria.minEnglishIelts ? `IELTS ${scheme.criteria.minEnglishIelts.toFixed(1)} or equivalent` : 'Not specified'],
                ['Eligible countries', scheme.criteria.countries.length ? scheme.criteria.countries.map((c) => COUNTRIES.find((x) => x.code === c)?.name).join(', ') : 'All countries'],
                ['Eligible faculties', scheme.criteria.faculties?.length ? scheme.criteria.faculties.join(', ') : 'All faculties'],
                ['Eligible courses', scheme.criteria.courseIds.length ? scheme.criteria.courseIds.map((c) => courseById[c]?.code).join(', ') : 'All courses'],
                ['Need-based assessment', scheme.criteria.needBased ? 'Yes — financial capacity statement is assessed' : 'No'],
                ['Demographic criterion', scheme.criteria.gender === 'f' ? 'Women only' : 'None'],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[12rem_1fr] gap-3 py-2 border-b border-slate-100 last:border-0">
                  <dt className="micro-label pt-0.5">{label}</dt>
                  <dd className="text-13 text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            <Button className="mt-4" variant="secondary" icon={Pencil} onClick={() => setEditing(scheme)}>
              Edit criteria
            </Button>
          </CardBody>
        )}
      </Card>

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Revoke ${scheme.name} from ${revoking?.applicantName}?`}
        tone="danger"
        confirmLabel="Revoke award"
        onConfirm={() => {
          dispatch({ type: 'REVOKE_AWARD', schemeId: scheme.id, awardId: revoking.id });
          toast(`Award revoked from ${revoking.applicantName}`, {
            tone: 'warning',
            description: `${currency(revoking.amount, scheme.currency)} returned to the scheme budget.`,
          });
        }}
      >
        <p className="text-13 text-slate-600 leading-relaxed">
          This frees one slot and returns {currency(revoking?.amount ?? 0, scheme.currency)} to the scheme budget.
          The revocation is recorded on the applicant's timeline.
        </p>
      </ConfirmDialog>

      <SchemeEditor
        key={editing?.id ?? 'new'}
        scheme={editing}
        courses={state.courses}
        onClose={() => setEditing(null)}
        onSave={(s) => {
          dispatch({ type: 'SAVE_SCHEME', scheme: s });
          toast(`“${s.name}” updated`);
          setEditing(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
function SchemeEditor({ scheme, courses, onClose, onSave }) {
  // Remounted via `key` at the call site whenever a different scheme is opened,
  // so the draft always starts from the scheme actually being edited.
  const [draft, setDraft] = useState(scheme);
  if (!scheme || !draft) return null;

  const setCriteria = (p) => setDraft({ ...draft, criteria: { ...draft.criteria, ...p } });
  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <Modal
      open={!!scheme}
      onClose={onClose}
      size="lg"
      title={scheme.id ? `Edit ${scheme.name}` : 'Create a scholarship scheme'}
      description="Criteria are matched against the applicant pool automatically — no manual shortlisting required."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          >
            {scheme.id ? 'Save changes' : 'Create scheme'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <TextField
          data-autofocus
          label="Scheme name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Vice-Chancellor's International Award"
        />
        <TextArea
          label="Description"
          hint="Shown to staff, and used as the basis for the award notification email."
          rows={3}
          maxLength={400}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SelectField
            label="Award type"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            options={[
              { value: 'fixed', label: 'Fixed amount' },
              { value: 'percentage', label: 'Percentage' },
            ]}
          />
          <TextField
            label={draft.type === 'percentage' ? 'Percentage (%)' : 'Amount (AUD)'}
            type="number"
            min={0}
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) || 0 })}
            inputClassName="tabular"
          />
          <TextField
            label="Total slots"
            type="number"
            min={1}
            value={draft.slotsTotal}
            onChange={(e) => setDraft({ ...draft, slotsTotal: Math.max(1, Number(e.target.value) || 1) })}
            inputClassName="tabular"
          />
          <TextField
            label="Budget cap (AUD)"
            type="number"
            min={0}
            step={1000}
            value={draft.budgetCap}
            onChange={(e) => setDraft({ ...draft, budgetCap: Number(e.target.value) || 0 })}
            inputClassName="tabular"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Application deadline"
            type="date"
            value={draft.deadline.slice(0, 10)}
            onChange={(e) => setDraft({ ...draft, deadline: new Date(e.target.value).toISOString() })}
          />
          <div className="flex items-end pb-1">
            <Toggle
              checked={draft.active}
              onChange={(v) => setDraft({ ...draft, active: v })}
              label="Scheme is active"
              description="Inactive schemes stop matching applicants."
            />
          </div>
        </div>

        <div className="pt-1 border-t border-slate-200">
          <h3 className="text-13 font-bold text-slate-900 mt-4 mb-3">Eligibility criteria</h3>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Minimum GPA"
              type="number"
              step={0.1}
              min={0}
              max={4}
              value={draft.criteria.minGpa}
              onChange={(e) => setCriteria({ minGpa: Number(e.target.value) || 0 })}
              inputClassName="tabular"
            />
            <TextField
              label="Minimum IELTS (or equivalent)"
              type="number"
              step={0.5}
              min={0}
              max={9}
              value={draft.criteria.minEnglishIelts ?? 0}
              onChange={(e) => setCriteria({ minEnglishIelts: Number(e.target.value) || 0 })}
              inputClassName="tabular"
            />
          </div>

          <Field className="mt-4" label="Eligible countries" hint="Leave all unselected to allow every country.">
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => {
                const on = draft.criteria.countries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCriteria({ countries: toggleIn(draft.criteria.countries, c.code) })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors
                      ${on ? 'border-royal-400 bg-royal-50 text-royal-800' : 'border-control bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span aria-hidden>{c.flag}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field className="mt-4" label="Eligible faculties" hint="Leave all unselected to allow every faculty.">
            <div className="flex flex-wrap gap-1.5">
              {FACULTIES.map((f) => {
                const on = (draft.criteria.faculties || []).includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCriteria({ faculties: toggleIn(draft.criteria.faculties || [], f) })}
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-colors
                      ${on ? 'border-accent-400 bg-accent-50 text-accent-800' : 'border-control bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="mt-4">
            <Toggle
              checked={draft.criteria.needBased}
              onChange={(v) => setCriteria({ needBased: v })}
              label="Need-based scheme"
              description="Financial capacity statement is assessed alongside academic merit."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
