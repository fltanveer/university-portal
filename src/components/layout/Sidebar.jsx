import {
  LayoutDashboard, FileText, GraduationCap, Award, Mail, BarChart3, Building2, RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRoute } from '../../lib/router';
import { useStore } from '../../store/AppStore';
import { stageById } from '../../data/mockData';
import ConfirmDialog from '../ui/ConfirmDialog';

const NAV = [
  { section: 'Admissions', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/applications', label: 'Applications', icon: FileText, badge: 'pending' },
    { to: '/scholarships', label: 'Scholarships', icon: Award },
    { to: '/communications', label: 'Communications', icon: Mail },
  ]},
  { section: 'Offering', items: [
    { to: '/courses', label: 'Courses', icon: GraduationCap },
    { to: '/profile', label: 'University Profile', icon: Building2 },
  ]},
  { section: 'Insight', items: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { path, navigate } = useRoute();
  const { state, dispatch, toast } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const pendingCount = useMemo(
    () => state.applicants.filter((a) => stageById(a.stage).order <= 5).length,
    [state.applicants]
  );

  const isActive = (item) =>
    item.exact ? path === '/' : path === item.to || path.startsWith(`${item.to}/`);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-sidebar flex flex-col
          bg-brand-900 bg-[radial-gradient(120%_60%_at_50%_0%,theme(colors.brand.800)_0%,theme(colors.brand.900)_45%,theme(colors.brand.950)_100%)]
          border-r border-brand-950/60 transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 h-topbar px-4 border-b border-white/[0.07] shrink-0">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-white text-brand-900 font-display text-xs shrink-0" aria-hidden>
            SF
          </span>
          <div className="min-w-0">
            <p className="font-display text-13 leading-none text-white tracking-[0.02em]">STUDYFOUND</p>
            <p className="text-2xs text-brand-300 font-semibold mt-0.5 leading-none">University Portal</p>
          </div>
        </div>

        {/* Institution context — makes it unambiguous whose queue this is */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.06] px-2.5 py-2 ring-1 ring-inset ring-white/[0.08]">
            <span className="grid place-items-center h-7 w-7 rounded-md bg-accent-600 text-white font-display text-xs shrink-0" aria-hidden>
              {state.university.logoText}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{state.university.name}</p>
              <p className="text-2xs text-brand-300 truncate">{state.university.location.city}, AU</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-2 pb-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-brand-300">{group.section}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <a
                        href={`#${item.to}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={onNavigate}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-13
                          transition-colors duration-150
                          ${
                            active
                              ? 'bg-white/[0.11] text-white font-bold'
                              : 'text-brand-200 font-medium hover:bg-white/[0.06] hover:text-white'
                          }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-accent-400" aria-hidden />
                        )}
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent-300' : 'text-brand-300 group-hover:text-brand-100'}`} aria-hidden />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge === 'pending' && pendingCount > 0 && (
                          <span className="rounded-full bg-accent-500 px-1.5 py-px text-2xs font-bold text-white tabular">
                            {pendingCount}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-0.5">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-13 font-medium
              text-brand-300 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
            Reset demo data
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all portal data?"
        tone="danger"
        confirmLabel="Reset everything"
        onConfirm={() => {
          dispatch({ type: 'RESET' });
          navigate('/');
          toast('Portal data reset to the original dataset', { tone: 'info' });
        }}
      >
        <p className="text-13 text-slate-600 leading-relaxed">
          This clears every decision, note, document review, scholarship award and sent message stored
          in this browser, and restores the original demo dataset. It cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}
