import { useMemo, useState } from 'react';
import { Download, GraduationCap, Layers, Plus, Users, X } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useRoute, Link } from '../lib/router';
import { FACULTIES } from '../data/mockData';
import { intakeStatus } from '../lib/eligibility';
import { currency, number } from '../lib/format';
import { exportCsv } from '../lib/csv';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { TableWrap, SortHeader } from '../components/ui/Table';
import { FilterBar, FilterSelect, SearchInput } from '../components/ui/FilterBar';
import { Toggle, TextField, TextArea, SelectField } from '../components/ui/Field';

const LEVELS = ['Bachelor', 'Master', 'PhD'];

const BLANK_COURSE = {
  title: '',
  code: '',
  faculty: FACULTIES[0],
  level: 'Master',
  duration: '2 years',
  tuition: 45000,
  description: '',
};

export default function Courses() {
  const { state, dispatch, toast } = useStore();
  const { navigate } = useRoute();
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [level, setLevel] = useState([]);
  const [status, setStatus] = useState([]);
  const [sort, setSort] = useState({ field: 'applicants', dir: 'desc' });
  const [creating, setCreating] = useState(null);

  const rows = useMemo(
    () =>
      state.courses.map((c) => {
        const applicants = state.applicants.filter((a) => a.courseId === c.id);
        const openIntakes = c.intakes.filter((i) => intakeStatus(i).id === 'open');
        const seats = c.intakes.reduce((s, i) => s + i.capacity, 0);
        const filled = c.intakes.reduce((s, i) => s + i.filled, 0);
        return { ...c, applicantCount: applicants.length, openIntakes, seats, filled };
      }),
    [state.courses, state.applicants]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (faculty.length && !faculty.includes(c.faculty)) return false;
      if (level.length && !level.includes(c.level)) return false;
      if (status.length) {
        const s = c.active ? 'active' : 'inactive';
        if (!status.includes(s)) return false;
      }
      if (term && !`${c.title} ${c.code} ${c.faculty}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, search, faculty, level, status]);

  const sorted = useMemo(() => {
    const getter = {
      title: (c) => c.title.toLowerCase(),
      faculty: (c) => c.faculty,
      level: (c) => LEVELS.indexOf(c.level),
      tuition: (c) => c.tuition,
      intakes: (c) => c.openIntakes.length,
      applicants: (c) => c.applicantCount,
    }[sort.field];
    return [...filtered].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av === bv) return a.title.localeCompare(b.title);
      return (av > bv ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1);
    });
  }, [filtered, sort]);

  const onSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === 'desc' ? 'asc' : 'desc' }));
  const activeFilters = faculty.length + level.length + status.length + (search ? 1 : 0);
  const clear = () => {
    setFaculty([]);
    setLevel([]);
    setStatus([]);
    setSearch('');
  };

  const handleExport = () => {
    const count = exportCsv(
      `courses-${new Date().toISOString().slice(0, 10)}`,
      [
        { label: 'Code', get: (c) => c.code },
        { label: 'Title', get: (c) => c.title },
        { label: 'Faculty', get: (c) => c.faculty },
        { label: 'Level', get: (c) => c.level },
        { label: 'Duration', get: (c) => c.duration },
        { label: 'Tuition (AUD/yr)', get: (c) => c.tuition },
        { label: 'Active', get: (c) => (c.active ? 'Yes' : 'No') },
        { label: 'Open intakes', get: (c) => c.openIntakes.length },
        { label: 'Total intakes', get: (c) => c.intakes.length },
        { label: 'Seats', get: (c) => c.seats },
        { label: 'Seats filled', get: (c) => c.filled },
        { label: 'Applicants', get: (c) => c.applicantCount },
        { label: 'Min GPA', get: (c) => c.requirements.minGpa },
        { label: 'Min IELTS', get: (c) => c.requirements.minIelts },
      ],
      sorted
    );
    toast(`Exported ${count} courses to CSV`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Courses"
        description="Everything you list on StudyFound, with the entry requirements that drive applicant eligibility."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setCreating(BLANK_COURSE)}>
              New course
            </Button>
          </>
        }
      />

      <Card className="overflow-visible">
        <div className="p-3 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search course or code…" width="w-full sm:w-72" />
            <span className="ml-auto text-xs text-slate-600 tabular">
              <span className="font-bold text-slate-800">{sorted.length}</span> of {rows.length}
            </span>
          </div>
          <FilterBar activeCount={activeFilters} onClear={clear}>
            <FilterSelect
              label="Faculty"
              icon={GraduationCap}
              width={270}
              options={FACULTIES.map((f) => ({ id: f, label: f, count: rows.filter((c) => c.faculty === f).length }))}
              value={faculty}
              onChange={setFaculty}
            />
            <FilterSelect
              label="Level"
              icon={Layers}
              options={LEVELS.map((l) => ({ id: l, label: l, count: rows.filter((c) => c.level === l).length }))}
              value={level}
              onChange={setLevel}
            />
            <FilterSelect
              label="Status"
              options={[
                { id: 'active', label: 'Active', count: rows.filter((c) => c.active).length },
                { id: 'inactive', label: 'Inactive', count: rows.filter((c) => !c.active).length },
              ]}
              value={status}
              onChange={setStatus}
            />
          </FilterBar>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={rows.length === 0 ? 'No courses listed' : 'No courses match these filters'}
            description={
              rows.length === 0
                ? 'Add a course to start receiving applications through StudyFound.'
                : 'Try clearing the faculty or level filter.'
            }
            action={
              activeFilters > 0 && (
                <Button variant="secondary" icon={X} onClick={clear}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <TableWrap>
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <SortHeader label="Course" field="title" sort={sort} onSort={onSort} />
                <SortHeader label="Faculty" field="faculty" sort={sort} onSort={onSort} />
                <SortHeader label="Level" field="level" sort={sort} onSort={onSort} />
                <SortHeader label="Tuition / yr" field="tuition" sort={sort} onSort={onSort} align="right" />
                <SortHeader label="Open intakes" field="intakes" sort={sort} onSort={onSort} align="right" />
                <SortHeader label="Applicants" field="applicants" sort={sort} onSort={onSort} align="right" />
                <th scope="col" className="th text-right">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/courses/${c.id}`)} className="row-link">
                  <td className="td max-w-[22rem]">
                    <Link
                      to={`/courses/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block group/name rounded"
                    >
                      <span className="block font-semibold text-slate-900 truncate group-hover/name:text-royal-700 transition-colors">
                        {c.title}
                      </span>
                      <span className="block text-2xs text-slate-600 tabular">
                        {c.code} · {c.duration}
                      </span>
                    </Link>
                  </td>
                  <td className="td text-slate-600 whitespace-nowrap">{c.faculty}</td>
                  <td className="td">
                    <Badge tone={c.level === 'Master' ? 'accent' : c.level === 'Bachelor' ? 'sky' : 'brand'} size="sm">
                      {c.level}
                    </Badge>
                  </td>
                  <td className="td text-right tabular whitespace-nowrap">{currency(c.tuition, c.currency)}</td>
                  <td className="td text-right">
                    <span className="tabular font-semibold">{c.openIntakes.length}</span>
                    <span className="text-slate-500 tabular"> / {c.intakes.length}</span>
                  </td>
                  <td className="td text-right">
                    <span className="inline-flex items-center gap-1 tabular font-semibold text-slate-800">
                      <Users className="h-3 w-3 text-slate-500" aria-hidden />
                      {number(c.applicantCount)}
                    </span>
                  </td>
                  <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <Toggle
                        checked={c.active}
                        ariaLabel={`List ${c.title} publicly on StudyFound`}
                        onChange={(v) => {
                          dispatch({ type: 'UPDATE_COURSE', id: c.id, patch: { active: v } });
                          toast(`${c.code} ${v ? 'is now live on StudyFound' : 'hidden from StudyFound'}`, {
                            tone: v ? 'success' : 'info',
                          });
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Modal
        open={!!creating}
        onClose={() => setCreating(null)}
        size="lg"
        title="Create a course"
        description="The course is created unlisted. Add intakes and entry requirements on the next screen, then switch it live."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!creating?.title.trim() || !creating?.code.trim()}
              onClick={() => {
                const course = {
                  ...creating,
                  title: creating.title.trim(),
                  code: creating.code.trim().toUpperCase(),
                  description: creating.description.trim(),
                };
                dispatch({ type: 'ADD_COURSE', course });
                setCreating(null);
                toast(`${course.code} created`, { description: 'Add an intake and entry requirements to start receiving applications.' });
              }}
            >
              Create course
            </Button>
          </>
        }
      >
        {creating && (
          <div className="space-y-4">
            <TextField
              data-autofocus
              label="Course title"
              value={creating.title}
              onChange={(e) => setCreating((c) => ({ ...c, title: e.target.value }))}
              placeholder="e.g. Master of Renewable Energy Engineering"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Course code"
                hint="Shown to students and used in exports."
                value={creating.code}
                onChange={(e) => setCreating((c) => ({ ...c, code: e.target.value }))}
                placeholder="MC-RENEW"
                inputClassName="uppercase"
              />
              <SelectField
                label="Faculty"
                value={creating.faculty}
                onChange={(e) => setCreating((c) => ({ ...c, faculty: e.target.value }))}
                options={FACULTIES.map((f) => ({ value: f, label: f }))}
              />
              <SelectField
                label="Level"
                value={creating.level}
                onChange={(e) => setCreating((c) => ({ ...c, level: e.target.value }))}
                options={LEVELS.map((l) => ({ value: l, label: l }))}
              />
              <TextField
                label="Duration"
                value={creating.duration}
                onChange={(e) => setCreating((c) => ({ ...c, duration: e.target.value }))}
              />
            </div>
            <TextField
              label="Tuition per year (AUD)"
              type="number"
              min={0}
              step={100}
              value={creating.tuition}
              onChange={(e) => setCreating((c) => ({ ...c, tuition: Number(e.target.value) || 0 }))}
              inputClassName="tabular"
            />
            <TextArea
              label="Description"
              optional
              hint="You can write this later on the course page."
              rows={4}
              maxLength={900}
              value={creating.description}
              onChange={(e) => setCreating((c) => ({ ...c, description: e.target.value }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
