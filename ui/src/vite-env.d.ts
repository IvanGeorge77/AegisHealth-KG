/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the FastAPI backend. Empty string = same origin (dev proxy). */
  readonly VITE_API_BASE_URL?: string;
  /** Default data source: "mock" (default) or "live". */
  readonly VITE_DATA_SOURCE?: "mock" | "live";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}