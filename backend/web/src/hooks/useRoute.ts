import { useCallback, useEffect, useState } from "react";

export type Route = {
  readonly path: string;
  readonly query: URLSearchParams;
  readonly navigate: (href: string) => void;
  /** Replaces the query string without adding a history entry: for filters that change as you adjust them. */
  readonly replaceQuery: (query: Readonly<Record<string, string>>) => void;
};

type Location = {
  readonly path: string;
  readonly query: URLSearchParams;
};

const readLocation = (): Location => ({ path: window.location.pathname, query: new URLSearchParams(window.location.search) });

/** A tiny router over the History API: the app has five pages, so a library would be more than it needs. */
export const useRoute = (): Route => {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPopState = (): void => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((href: string) => {
    window.history.pushState(null, "", href);
    setLocation(readLocation());
  }, []);

  const replaceQuery = useCallback((query: Readonly<Record<string, string>>) => {
    const search = new URLSearchParams(query).toString();
    window.history.replaceState(null, "", search.length > 0 ? `${window.location.pathname}?${search}` : window.location.pathname);
    setLocation(readLocation());
  }, []);

  return { path: location.path, query: location.query, navigate, replaceQuery };
};
