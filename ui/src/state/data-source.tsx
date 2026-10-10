import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_DATA_SOURCE,
  getApiClient,
  type AegisApiClient,
  type DataSource,
} from "@/api";

/* ============================================================================
   Data source context
   ----------------------------------------------------------------------------
   Lets the top bar switch between fictional mock data and the live backend
   without a rebuild. The active mode is surfaced in the UI at all times, so a
   reviewer can never mistake demonstration data for a real analysis.

   The choice is kept in sessionStorage. Without it, navigating between cases
   would silently drop a reviewer back to mock data — and a silent revert is
   worse than no switch at all, because the results still look real.
   ========================================================================= */

const STORAGE_KEY = "aegis.data-source";

function readStoredMode(): DataSource {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored === "live" || stored === "mock" ? stored : DEFAULT_DATA_SOURCE;
  } catch {
    // Private mode or blocked storage — fall back to the build default.
    return DEFAULT_DATA_SOURCE;
  }
}

interface DataSourceContextValue {
  mode: DataSource;
  setMode: (mode: DataSource) => void;
  client: AegisApiClient;
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataSource>(readStoredMode);

  const value = useMemo<DataSourceContextValue>(() => {
    const setMode = (next: DataSource) => {
      setModeState(next);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Non-fatal: the switch still works for this session's lifetime.
      }
    };
    return { mode, setMode, client: getApiClient(mode) };
  }, [mode]);

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useApiClient(): AegisApiClient {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error("useApiClient must be used inside <DataSourceProvider>");
  }
  return context.client;
}

export function useDataSource(): DataSourceContextValue {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error("useDataSource must be used inside <DataSourceProvider>");
  }
  return context;
}