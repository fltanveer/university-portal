import { useMemo, useState, useEffect } from 'react';
import {
  Bookmark, BookmarkPlus, ChevronLeft, ChevronRight, Download, Globe2, GraduationCap, Inbox, Layers, ShieldCheck, Trash2, UserCog, X, Check, ArrowRightLeft,
} from 'lucide-react';
import { useStore, useLookups } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { COUNTRIES, STAGES, stageById } from '../data/mockData';
import { evaluateEligibility, ELIGIBILITY } from '../lib/eligibility';
import { daysBetween, formatDate, number } from '../lib/format';
import { exportCsv } from '../lib/csv';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../components/ui/Dropdown';
import { TableWrap, SortHeader, Checkbox } from '../components/ui/Table';
import { FilterBar, FilterSelect, SearchInput } from '../components/ui/FilterBar';
import { TextField } from '../components/ui/Field';
import { StageBadge, EligibilityPill, AgeIndicator } from '../components/app/StatusPills';

const EMPTY_FILTERS = { stage: [], course: [], intake: [], country: [], eligibility: [], reviewer: [], search: '' };
const PAGE_SIZES = [25, 50, 100];

export default function Applications() {
  const { state, dispatch, toast } = useStore();
  const { navigate, query } = useRoute();
  const { courseById, intakeById, reviewerById } = useLookups();

  // Deep links from the dashboard, course pages and notifications arrive as query
  // params; each one seeds the matching filter so the link lands pre-filtered.
  const [filters, setFilters] = useState(() => {
    const fromQuery = {};
    ['stage', 'course', 'intake', 'country', 'eligibility', 'reviewer'].forEach((key) => {
      if (query[key]) fromQuery[key] = query[key].split(',');
    });
    return { ...EMPTY_FILTERS, ...fromQuery, search: query.q ?? '' };
  });
  const [sort, setSort] = useState(() =>
    query.sort === 'daysInStage' ? { field: 'daysInStage', dir: 'desc' } : { field: 'applicationDate', dir: 'desc' }
  );
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [pendingBulkStage, setPendingBulkStage] = useState(null);

  // Eligibility is derived on every render from the live course requirements.
  const rows = useMemo(
    () =>
      state.applicants.map((a) => {
        const course = courseById[a.courseId];
        return {
          ...a,
          course,
          intake: intakeById[a.intakeId],
          reviewer: a.assignedReviewer ? reviewerById[a.assignedReviewer] : null,
          eligibility: evaluateEligibility(a, course),
          daysInStage: daysBetween(a.stageChangedAt),
        };
      }),
    [state.applicants, courseById, intakeById, reviewerById]
  );

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.stage.length && !filters.stage.includes(r.stage)) return false;
      if (filters.course.length && !filters.course.includes(r.courseId)) return false;
      if (filters.intake.length && !filters.intake.includes(r.intakeId)) return false;
      if (filters.country.length && !filters.country.includes(r.countryCode)) return false;
      if (filters.eligibility.length && !filters.eligibility.includes(r.eligibility.status)) return false;
      if (filters.reviewer.length && !filters.reviewer.includes(r.assignedReviewer ?? 'unassigned')) return false;
      if (term) {
        const haystack = `${r.name} ${r.reference} ${r.email} ${r.nationality} ${r.course?.title ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => {
    const getter = {
      name: (r) => r.name.toLowerCase(),
      course: (r) => r.course?.title?.toLowerCase() ?? '',
      intake: (r) => r.intake?.label ?? '',
      country: (r) => r.nationality,
      eligibility: (r) => ['not_met', 'borderline', 'meets'].indexOf(r.eligibility.status),
      stage: (r) => stageById(r.stage).order,
      daysInStage: (r) => r.daysInStage,
      reviewer: (r) => r.reviewer?.name ?? 'zzz',
      applicationDate: (r) => new Date(r.applicationDate).getTime(),
    }[sort.field];

    return [...filtered].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av === bv) return a.name.localeCompare(b.name);
      return (av > bv ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1);
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [filters, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const activeFilterCount =
    filters.stage.length + filters.course.length + filters.intake.length +
    filters.country.length + filters.eligibility.length + filters.reviewer.length + (filters.search ? 1 : 0);

  const onSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'desc' ? 'asc' : 'desc' }));

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // Filter option lists carry live counts so staff can see where volume sits.
  const stageOptions = STAGES.map((s) => ({ id: s.id, label: s.label, count: rows.filter((r) => r.stage === s.id).length }));
  const courseOptions = state.courses.map((c) => ({ id: c.id, label: c.title, count: rows.filter((r) => r.courseId === c.id).length }));
  const intakeOptions = Object.values(intakeById).map((i) => ({
    id: i.id,
    label: `${i.label} — ${courseById[i.courseId]?.code ?? ''}`,
    count: rows.filter((r) => r.intakeId === i.id).length,
  })).filter((o) => o.count > 0);
  const countryOptions = COUNTRIES.map((c) => ({ id: c.code, label: `${c.flag}  ${c.name}`, count: rows.filter((r) => r.countryCode === c.code).length }));
  const eligOptions = Object.values(ELIGIBILITY).map((e) => ({ id: e.id, label: e.label, count: rows.filter((r) => r.eligibility.status === e.id).length }));
  const reviewerOptions = [
    ...state.reviewers.map((r) => ({ id: r.id, label: r.name, count: rows.filter((x) => x.assignedReviewer === r.id).length })),
    { id: 'unassigned', label: 'Unassigned', count: rows.filter((x) => !x.assignedReviewer).length },
  ];

  const handleExport = (subset) => {
    const data = subset ?? sorted;
    const count = exportCsv(
      `applications-${new Date().toISOString().slice(0, 10)}`,
      [
        { label: 'Reference', get: (r) => r.reference },
        { label: 'Student', get: (r) => r.name },
        { label: 'Email', get: (r) => r.email },
        { label: 'Nationality', get: (r) => r.nationality },
        { label: 'Age', get: (r) => r.age },
        { label: 'Course', get: (r) => r.course?.title },
        { label: 'Course code', get: (r) => r.course?.code },
        { label: 'Intake', get: (r) => r.intake?.label },
        { label: 'GPA (4.0)', get: (r) => r.gpa.value.toFixed(2) },
        { label: 'English test', get: (r) => `${r.englishTest.type} ${r.englishTest.overall}` },
        { label: 'Eligibility', get: (r) => r.eligibility.label },
        { label: 'Eligibility detail', get: (r) => r.eligibility.summary },
        { label: 'Stage', get: (r) => stageById(r.stage).label },
        { label: 'Days in stage', get: (r) => r.daysInStage },
        { label: 'Assigned reviewer', get: (r) => r.reviewer?.name ?? 'Unassigned' },
        { label: 'Submitted', get: (r) => formatDate(r.applicationDate) },
      ],
      data
    );
    toast(`Exported ${count} application${count === 1 ? '' : 's'} to CSV`, { description: 'Check your downloads folder.' });
  };

  const applyView = (view) => {
    setFilters({ ...EMPTY_FILTERS, ...view.filters });
    toast(`Applied view “${view.name}”`, { tone: 'info' });
  };

  const selectedIds = [...selected];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applications"
        description="Every student who applied to your courses through StudyFound."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => handleExport()}>
              Export CSV
            </Button>
            <Dropdown
              align="right"
              width={260}
              trigger={({ toggle }) => (
                <Button variant="secondary" icon={Bookmark} onClick={toggle}>
                  Saved views
                </Button>
              )}
            >
              {({ close }) => (
                <div>
                  <MenuLabel>Saved views</MenuLabel>
                  {state.savedViews.map((v) => (
                    <div key={v.id} className="group flex items-center gap-1">
                      <MenuItem
                        icon={Bookmark}
                        onClick={() => {
                          applyView(v);
                          close();
                        }}
                      >
                        {v.name}
                      </MenuItem>
                      {!v.system && (
                        <button
                          type="button"
                          aria-label={`Delete view ${v.name}`}
                          onClick={() => dispatch({ type: 'DELETE_VIEW', id: v.id })}
                          className="shrink-0 mr-1 h-6 w-6 grid place-items-center rounded text-slate-300
                            hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <MenuDivider />
                  <MenuItem
                    icon={BookmarkPlus}
                    disabled={activeFilterCount === 0}
                    onClick={() => {
                      setViewName('');
                      setSaveViewOpen(true);
                      close();
                    }}
                  >
                    {activeFilterCount === 0 ? 'Set filters to save a view' : 'Save current filters…'}
                  </MenuItem>
                </div>
              )}
            </Dropdown>
          </>
        }
      />

      <Card className="overflow-visible">
        <div className="p-3 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={filters.search}
              onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
              placeholder="Search name, reference or email…"
              width="w-full sm:w-72"
            />
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <span className="tabular">
                <span className="font-bold text-slate-800">{number(sorted.length)}</span> of {number(rows.length)}
              </span>
            </div>
          </div>

          <FilterBar
            activeCount={activeFilterCount}
            onClear={() => setFilters(EMPTY_FILTERS)}
          >
            <FilterSelect label="Stage" icon={Layers} options={stageOptions} value={filters.stage} onChange={(v) => setFilters((f) => ({ ...f, stage: v }))} />
            <FilterSelect label="Course" icon={GraduationCap} options={courseOptions} value={filters.course} onChange={(v) => setFilters((f) => ({ ...f, course: v }))} width={300} searchable />
            <FilterSelect label="Intake" icon={Layers} options={intakeOptions} value={filters.intake} onChange={(v) => setFilters((f) => ({ ...f, intake: v }))} width={290} searchable />
            <FilterSelect label="Country" icon={Globe2} options={countryOptions} value={filters.country} onChange={(v) => setFilters((f) => ({ ...f, country: v }))} />
            <FilterSelect label="Eligibility" icon={ShieldCheck} options={eligOptions} value={filters.eligibility} onChange={(v) => setFilters((f) => ({ ...f, eligibility: v }))} />
            <FilterSelect label="Reviewer" icon={UserCog} options={reviewerOptions} value={filters.reviewer} onChange={(v) => setFilters((f) => ({ ...f, reviewer: v }))} />
          </FilterBar>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-royal-50 border-b border-royal-200 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 text-13 font-bold text-royal-900">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {selected.size} selected
            </span>
            <span className="h-4 w-px bg-royal-200" aria-hidden />
            <Dropdown
              width={230}
              trigger={({ toggle }) => (
                <Button variant="secondary" size="sm" icon={UserCog} onClick={toggle}>
                  Assign reviewer
                </Button>
              )}
            >
              {({ close }) => (
                <div>
                  <MenuLabel>Assign {selected.size} application{selected.size > 1 ? 's' : ''} to</MenuLabel>
                  {state.reviewers.map((r) => (
                    <MenuItem
                      key={r.id}
                      onClick={() => {
                        dispatch({ type: 'ASSIGN_REVIEWER', ids: selectedIds, reviewerId: r.id });
                        toast(`Assigned ${selected.size} application${selected.size > 1 ? 's' : ''} to ${r.name}`);
                        setSelected(new Set());
                        close();
                      }}
                    >
                      {r.name}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem
                    tone="danger"
                    onClick={() => {
                      dispatch({ type: 'ASSIGN_REVIEWER', ids: selectedIds, reviewerId: null });
                      toast('Reviewer removed', { tone: 'info' });
                      setSelected(new Set());
                      close();
                    }}
                  >
                    Unassign
                  </MenuItem>
                </div>
              )}
            </Dropdown>

            <Dropdown
              width={230}
              trigger={({ toggle }) => (
                <Button variant="secondary" size="sm" icon={ArrowRightLeft} onClick={toggle}>
                  Move stage
                </Button>
              )}
            >
              {({ close }) => (
                <div>
                  <MenuLabel>Move to stage</MenuLabel>
                  {STAGES.map((s) => (
                    <MenuItem
                      key={s.id}
                      onClick={() => {
                        setPendingBulkStage(s.id);
                        setBulkStageOpen(true);
                        close();
                      }}
                    >
                      {s.label}
                    </MenuItem>
                  ))}
                </div>
              )}
            </Dropdown>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => handleExport(sorted.filter((r) => selected.has(r.id)))}
            >
              Export selected
            </Button>
            <Button variant="ghost" size="sm" icon={X} onClick={() => setSelected(new Set())} className="ml-auto">
              Clear selection
            </Button>
          </div>
        )}

        {sorted.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={rows.length === 0 ? 'No applications yet' : 'No applications match these filters'}
            description={
              rows.length === 0
                ? 'When students apply to your courses through StudyFound, they will appear here.'
                : 'Try widening the stage, course or eligibility filters, or clear the search term.'
            }
            action={
              activeFilterCount > 0 && (
                <Button variant="secondary" icon={X} onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear all filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="th w-9 pr-0">
                    <Checkbox
                      checked={allOnPageSelected}
                      indeterminate={pageRows.some((r) => selected.has(r.id))}
                      onChange={toggleAll}
                      label="Select all applications on this page"
                    />
                  </th>
                  <SortHeader label="Student" field="name" sort={sort} onSort={onSort} />
                  <SortHeader label="Course" field="course" sort={sort} onSort={onSort} />
                  <SortHeader label="Intake" field="intake" sort={sort} onSort={onSort} />
                  <SortHeader label="Country" field="country" sort={sort} onSort={onSort} />
                  <SortHeader label="Eligibility" field="eligibility" sort={sort} onSort={onSort} />
                  <SortHeader label="Stage" field="stage" sort={sort} onSort={onSort} />
                  <SortHeader label="Days" field="daysInStage" sort={sort} onSort={onSort} align="right" />
                  <SortHeader label="Reviewer" field="reviewer" sort={sort} onSort={onSort} />
                  <SortHeader label="Submitted" field="applicationDate" sort={sort} onSort={onSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/applications/${r.id}`)}
                    className={`row-link ${selected.has(r.id) ? 'bg-royal-50/60' : ''}`}
                  >
                    <td className="td pr-0">
                      <Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} label={`Select ${r.name}`} />
                    </td>
                    <td className="td">
                      <Link
                        to={`/applications/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 min-w-0 group/name rounded"
                      >
                        <Avatar name={r.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900 truncate group-hover/name:text-royal-700 transition-colors">
                            {r.name}
                          </span>
                          <span className="block text-2xs text-slate-600 tabular">{r.reference}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="td max-w-[15rem]">
                      <p className="truncate">{r.course?.title ?? '—'}</p>
                      <p className="text-2xs text-slate-600">{r.course?.code}</p>
                    </td>
                    <td className="td whitespace-nowrap text-slate-600">{r.intake?.label ?? '—'}</td>
                    <td className="td whitespace-nowrap">
                      <span className="mr-1.5" aria-hidden>{COUNTRIES.find((c) => c.code === r.countryCode)?.flag}</span>
                      {r.nationality}
                    </td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <EligibilityPill result={r.eligibility} size="sm" />
                    </td>
                    <td className="td">
                      <StageBadge stage={r.stage} size="sm" />
                    </td>
                    <td className="td text-right">
                      <AgeIndicator days={r.daysInStage} />
                    </td>
                    <td className="td whitespace-nowrap">
                      {r.reviewer ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar name={r.reviewer.name} size="xs" />
                          <span className="text-slate-600">{r.reviewer.name}</span>
                        </span>
                      ) : (
                        <Badge tone="slate" size="sm">Unassigned</Badge>
                      )}
                    </td>
                    <td className="td text-right whitespace-nowrap text-slate-500 tabular">{formatDate(r.applicationDate)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 border-t border-slate-200 bg-slate-50/60 rounded-b-xl">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label htmlFor="page-size" className="font-semibold">Rows</label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="select h-7 text-xs"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="tabular">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="px-2 text-xs font-semibold text-slate-600 tabular">
                  Page {page} of {totalPages}
                </span>
                <Button variant="secondary" size="sm" iconRight={ChevronRight} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Save view */}
      <Modal
        open={saveViewOpen}
        onClose={() => setSaveViewOpen(false)}
        title="Save this filter set as a view"
        description="Views are shared with your admissions team and appear in the Saved views menu."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaveViewOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!viewName.trim()}
              onClick={() => {
                dispatch({ type: 'SAVE_VIEW', view: { name: viewName.trim(), filters } });
                toast(`View “${viewName.trim()}” saved`);
                setSaveViewOpen(false);
              }}
            >
              Save view
            </Button>
          </>
        }
      >
        <TextField
          data-autofocus
          label="View name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          placeholder="e.g. Nigeria — Master's, borderline"
        />
        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="micro-label mb-1.5">Filters captured</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {filters.search && <li>Search: “{filters.search}”</li>}
            {filters.stage.length > 0 && <li>Stage: {filters.stage.map((s) => stageById(s).label).join(', ')}</li>}
            {filters.course.length > 0 && <li>Course: {filters.course.map((c) => courseById[c]?.code).join(', ')}</li>}
            {filters.intake.length > 0 && <li>Intake: {filters.intake.map((i) => intakeById[i]?.label).join(', ')}</li>}
            {filters.country.length > 0 && <li>Country: {filters.country.map((c) => COUNTRIES.find((x) => x.code === c)?.name).join(', ')}</li>}
            {filters.eligibility.length > 0 && <li>Eligibility: {filters.eligibility.map((e) => ELIGIBILITY[e].label).join(', ')}</li>}
            {filters.reviewer.length > 0 && <li>Reviewer: {filters.reviewer.map((r) => reviewerById[r]?.name ?? 'Unassigned').join(', ')}</li>}
          </ul>
        </div>
      </Modal>

      {/* Bulk stage confirmation — a stage move writes to every selected timeline */}
      <Modal
        open={bulkStageOpen}
        onClose={() => setBulkStageOpen(false)}
        title={`Move ${selected.size} application${selected.size > 1 ? 's' : ''} to ${pendingBulkStage ? stageById(pendingBulkStage).label : ''}?`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkStageOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              data-autofocus
              onClick={() => {
                dispatch({ type: 'BULK_MOVE_STAGE', ids: selectedIds, stage: pendingBulkStage });
                toast(`Moved ${selected.size} application${selected.size > 1 ? 's' : ''} to ${stageById(pendingBulkStage).label}`, {
                  description: 'Each application timeline has been updated.',
                });
                setSelected(new Set());
                setBulkStageOpen(false);
              }}
            >
              Move {selected.size} application{selected.size > 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        <p className="text-13 text-slate-600 leading-relaxed">
          This records a stage change on every selected application and appends an entry to each activity
          timeline. It does not send any email to the students — use Communications for that.
        </p>
      </Modal>
    </div>
  );
}
