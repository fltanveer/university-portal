import { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu, Settings, CornerDownLeft } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { useRoute } from '../../lib/router';
import { CURRENT_USER, stageById } from '../../data/mockData';
import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import { daysBetween } from '../../lib/format';

export default function TopBar({ onOpenMobileNav }) {
  const { state, toast } = useStore();
  const { navigate } = useRoute();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Global search spans applicants and courses — the two things staff look up by name.
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return { applicants: [], courses: [] };
    return {
      applicants: state.applicants
        .filter(
          (a) =>
            a.name.toLowerCase().includes(term) ||
            a.reference.toLowerCase().includes(term) ||
            a.email.toLowerCase().includes(term) ||
            a.nationality.toLowerCase().includes(term)
        )
        .slice(0, 6),
      courses: state.courses
        .filter((c) => c.title.toLowerCase().includes(term) || c.code.toLowerCase().includes(term))
        .slice(0, 4),
    };
  }, [q, state.applicants, state.courses]);

  const hasResults = results.applicants.length + results.courses.length > 0;

  useEffect(() => {
    const onDoc = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (to) => {
    navigate(to);
    setQ('');
    setOpen(false);
  };

  // "Notifications" are derived, not stored: stale applications and closing intakes.
  const alerts = useMemo(() => {
    const stale = state.applicants.filter(
      (a) => stageById(a.stage).order <= 5 && daysBetween(a.stageChangedAt) >= 5
    );
    const closing = state.courses.flatMap((c) =>
      c.intakes
        .filter((i) => {
          const d = daysBetween(new Date().toISOString(), i.closeDate);
          return d >= 0 && d <= 30;
        })
        .map((i) => ({ course: c, intake: i, days: daysBetween(new Date().toISOString(), i.closeDate) }))
    );
    return { stale, closing };
  }, [state.applicants, state.courses]);

  const alertCount = alerts.stale.length + alerts.closing.length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 h-topbar px-3 sm:px-5
      bg-white/85 backdrop-blur-md border-b border-slate-200">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="lg:hidden h-8 w-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Global search */}
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search applicants, references, courses…"
          aria-label="Search applicants and courses"
          className="input pl-8 pr-14 bg-slate-100 border-transparent hover:bg-slate-50 focus:bg-white"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block
          rounded border border-slate-300 bg-white px-1.5 py-0.5 text-2xs font-bold text-slate-600">
          ⌘K
        </kbd>

        {open && q.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-200
            bg-white p-1 shadow-pop animate-slide-up max-h-[26rem] overflow-y-auto scrollbar-thin">
            {!hasResults && (
              <p className="px-3 py-6 text-center text-13 text-slate-500">
                No applicants or courses match “{q}”.
              </p>
            )}
            {results.applicants.length > 0 && (
              <>
                <p className="px-2 pt-1.5 pb-1 micro-label">Applicants</p>
                {results.applicants.map((a) => {
                  const course = state.courses.find((c) => c.id === a.courseId);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => go(`/applications/${a.id}`)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left
                        hover:bg-slate-100 transition-colors group"
                    >
                      <Avatar name={a.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-13 font-semibold text-slate-800 truncate">{a.name}</span>
                        <span className="block text-2xs text-slate-600 truncate">
                          {a.reference} · {course?.title}
                        </span>
                      </span>
                      <span className="text-2xs font-semibold text-slate-600 shrink-0">{stageById(a.stage).label}</span>
                      <CornerDownLeft className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" aria-hidden />
                    </button>
                  );
                })}
              </>
            )}
            {results.courses.length > 0 && (
              <>
                <p className="px-2 pt-2 pb-1 micro-label">Courses</p>
                {results.courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(`/courses/${c.id}`)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left
                      hover:bg-slate-100 transition-colors"
                  >
                    <span className="grid place-items-center h-7 w-7 rounded-md bg-brand-50 text-brand-800 text-2xs font-bold shrink-0" aria-hidden>
                      {c.level[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-13 font-semibold text-slate-800 truncate">{c.title}</span>
                      <span className="block text-2xs text-slate-600 truncate">{c.code} · {c.faculty}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <Dropdown
          align="right"
          width={330}
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label={`Notifications, ${alertCount} items need attention`}
              className="relative h-8 w-8 grid place-items-center rounded-lg text-slate-500
                hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
              )}
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <MenuLabel>Needs attention</MenuLabel>
              {alertCount === 0 && <p className="px-2 py-4 text-center text-13 text-slate-500">Nothing needs attention.</p>}
              {alerts.stale.slice(0, 4).map((a) => (
                <MenuItem
                  key={a.id}
                  onClick={() => {
                    navigate(`/applications/${a.id}`);
                    close();
                  }}
                >
                  <span className="block truncate">{a.name}</span>
                  <span className="block text-2xs text-slate-600 font-normal">
                    {daysBetween(a.stageChangedAt)} days in {stageById(a.stage).label}
                  </span>
                </MenuItem>
              ))}
              {alerts.closing.slice(0, 3).map(({ course, intake, days }) => (
                <MenuItem
                  key={intake.id}
                  onClick={() => {
                    navigate(`/courses/${course.id}`);
                    close();
                  }}
                >
                  <span className="block truncate">{intake.label} — {course.title}</span>
                  <span className="block text-2xs text-amber-700 font-semibold">Applications close in {days} days</span>
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  navigate('/applications');
                  close();
                }}
              >
                View all applications
              </MenuItem>
            </div>
          )}
        </Dropdown>

        <div className="hidden sm:block w-px h-5 bg-slate-200 mx-1" aria-hidden />

        {/* User menu */}
        <Dropdown
          align="right"
          width={244}
          trigger={({ toggle, open: menuOpen }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-lg pl-1 pr-1.5 py-1 hover:bg-slate-100 transition-colors"
            >
              <Avatar name={CURRENT_USER.name} size="sm" />
              <span className="hidden md:block text-left leading-tight">
                <span className="block text-xs font-bold text-slate-800">{CURRENT_USER.name}</span>
                <span className="block text-2xs text-slate-600">{CURRENT_USER.role}</span>
              </span>
              <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <div className="px-2 py-2 border-b border-slate-200 mb-1">
                <p className="text-13 font-bold text-slate-900">{CURRENT_USER.name}</p>
                <p className="text-2xs text-slate-600">{CURRENT_USER.email}</p>
              </div>
              <MenuItem
                icon={Settings}
                onClick={() => {
                  navigate('/profile');
                  close();
                }}
              >
                University settings
              </MenuItem>
              <MenuDivider />
              <p className="px-2 py-1.5 text-2xs text-slate-600 leading-relaxed">
                Demo build — signed in as {CURRENT_USER.name.split(' ')[0]} with no authentication layer.
              </p>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
