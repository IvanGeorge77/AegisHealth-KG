import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ============================================================================
   Page metadata context
   ----------------------------------------------------------------------------
   Lets each page describe itself to the top bar — title and breadcrumb trail —
   so the top bar carries navigation context instead of product branding.

   A page declares its own metadata by calling `usePageMeta({ ... })` at the
   top level. This keeps the data next to the route it describes and avoids a
   route-title registry that would drift out of sync.
   ========================================================================= */

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  to?: string;
}

interface PageMeta {
  title: string;
  crumbs: Crumb[];
}

interface PageMetaContextValue extends PageMeta {
  setMeta: (meta: PageMeta) => void;
}

const EMPTY: PageMeta = { title: "", crumbs: [] };

const PageMetaContext = createContext<PageMetaContextValue | null>(null);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>(EMPTY);

  return (
    <PageMetaContext.Provider value={{ ...meta, setMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
}

function usePageMetaContext() {
  const context = useContext(PageMetaContext);
  if (!context) {
    throw new Error("usePageMeta must be used inside <PageMetaProvider>");
  }
  return context;
}

/** Reads the metadata the current page declared. Used by the top bar. */
export function useCurrentPageMeta(): PageMeta {
  const { title, crumbs } = usePageMetaContext();
  return { title, crumbs };
}

/**
 * Declares the current page's title and breadcrumbs for the top bar.
 *
 * Call once per page, unconditionally, at the top level of the component.
 */
export function usePageMeta({ title, crumbs = [] }: PageMeta): void {
  const { setMeta } = usePageMetaContext();

  // Serialised so the effect only re-runs when the visible metadata changes,
  // not on every render when callers build fresh arrays.
  const signature = useMemo(() => JSON.stringify([title, crumbs]), [title, crumbs]);

  useEffect(() => {
    setMeta({ title, crumbs });
    return () => setMeta(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, setMeta]);
}

/** Convenience: a breadcrumb trail that ends at the current page. */
export function useSectionMeta(title: string, parent?: Crumb): void {
  const crumbs = useMemo(
    () => (parent ? [parent, { label: title }] : [{ label: title }]),
    [title, parent?.label, parent?.to],
  );
  usePageMeta({ title, crumbs });
}