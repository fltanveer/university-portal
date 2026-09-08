import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

/**
 * Minimal hash router — the app has a flat, well-known route table and adding a
 * routing dependency for nine screens would not earn its weight.
 */
const RouterContext = createContext(null);

const readHash = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return {
    path: path.startsWith('/') ? path : `/${path}`,
    segments: path.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(query)),
  };
};

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    const onChange = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
      document.getElementById('main-content')?.scrollTo?.({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.hash = '#/';
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to, opts = {}) => {
    const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
    if (opts.replace) window.history.replaceState(null, '', target);
    window.location.hash = target;
    if (opts.replace) setRoute(readHash());
  }, []);

  const value = useMemo(() => ({ ...route, navigate }), [route, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRoute() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRoute must be used inside <RouterProvider>');
  return ctx;
}

export function useNavigate() {
  return useRoute().navigate;
}

/** Anchor that keeps real href semantics (middle-click, copy link) working. */
export function Link({ to, children, className = '', onClick, ...props }) {
  return (
    <a
      href={`#${to.startsWith('/') ? to : `/${to}`}`}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  );
}
