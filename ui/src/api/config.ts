/* ============================================================================
   API configuration
   ----------------------------------------------------------------------------
   One place to decide where data comes from. Nothing else in the app reads
   `import.meta.env` directly.

   Data sources
   ------------
   `mock` — Fictional demonstration data. No network. Clearly labelled in the
            top bar at all times. Used when the backend is not running.
   `live` — Real calls to the FastAPI backend.

   The FastAPI app has no CORS middleware, so `VITE_API_BASE_URL` should be left
   as the default empty string and requests should go to the relative `/api`
   path, which Vite proxies to http://localhost:8000 in development
   (see vite.config.ts). If you serve the built assets from a different origin
   than the API, set an absolute base URL *and* configure CORS in
   `src/aegis/api/main.py`.
   ========================================================================= */

export type DataSource = "mock" | "live";

/** Base URL for the backend. Empty = same origin (use the dev proxy). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

/** Default data source, overridable at build time. */
export const DEFAULT_DATA_SOURCE: DataSource =
  import.meta.env.VITE_DATA_SOURCE === "live" ? "live" : "mock";

/** Upload constraints, mirrored from src/aegis/api/routes/documents.py. */
export const UPLOAD_LIMITS = {
  allowedContentTypes: ["application/pdf", "text/plain"] as const,
  allowedExtensions: [".pdf", ".txt"] as const,
  maxSizeMb: 20,
} as const;