import { useState, useEffect } from 'react';
import { AppProvider } from './store/AppStore';
import { RouterProvider, useRoute } from './lib/router';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ToastHost from './components/ui/Toast';
import EmptyState from './components/ui/EmptyState';
import Button from './components/ui/Button';
import { Compass } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Scholarships from './pages/Scholarships';
import Communications from './pages/Communications';
import Analytics from './pages/Analytics';
import UniversityProfile from './pages/UniversityProfile';

function Routes() {
  const { segments, query, navigate } = useRoute();
  const [root, id] = segments;
  // List screens seed their filter state from the URL on mount. Keying them by the
  // query string means a deep link re-applies its filters even when the user is
  // already sitting on that screen.
  const queryKey = JSON.stringify(query);

  switch (root) {
    case undefined:
      return <Dashboard />;
    case 'applications':
      return id ? <ApplicationDetail id={id} /> : <Applications key={queryKey} />;
    case 'courses':
      return id ? <CourseDetail id={id} /> : <Courses />;
    case 'scholarships':
      return <Scholarships schemeId={id} />;
    case 'communications':
      return <Communications tab={id} />;
    case 'analytics':
      return <Analytics />;
    case 'profile':
      return <UniversityProfile />;
    default:
      return (
        <div className="p-6">
          <EmptyState
            icon={Compass}
            title="Page not found"
            description={`Nothing lives at /${segments.join('/')}. It may have been renamed, or the link may be out of date.`}
            action={
              <Button variant="primary" onClick={() => navigate('/')}>
                Back to dashboard
              </Button>
            }
          />
        </div>
      );
  }
}

function Shell() {
  const [mobileNav, setMobileNav] = useState(false);
  const { path } = useRoute();

  useEffect(() => {
    setMobileNav(false);
  }, [path]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]
          focus:rounded-lg focus:bg-brand-900 focus:px-3 focus:py-2 focus:text-13 focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar mobileOpen={mobileNav} onNavigate={() => setMobileNav(false)} />

      {mobileNav && (
        <div
          className="fixed inset-0 z-30 bg-brand-950/40 lg:hidden animate-fade-in"
          onClick={() => setMobileNav(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-sidebar">
        <TopBar onOpenMobileNav={() => setMobileNav(true)} />
        <main id="main-content" className="mx-auto w-full max-w-content px-4 sm:px-6 py-5 sm:py-6">
          <Routes />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </AppProvider>
  );
}
