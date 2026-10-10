import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { useApiClient } from "./data-source";
import type { ExtractionResponse, UploadResponse } from "@/types/api";

/* ============================================================================
   Pipeline store
   ----------------------------------------------------------------------------
   Single source of truth for the six-stage pipeline that drives the case
   workspace. Every step transition, loading flag and error lives here; step
   components read from it and dispatch actions, they do not hold their own
   copy of pipeline state.

   Stage availability is a property of the *backend*, not of the UI:
     Phase 4  Document Upload              → live  (src/aegis/api/routes/documents.py)
     Phase 5  Entity Extraction            → live  (src/aegis/api/routes/extraction.py)
     Phase 6  Graph Reasoning              → not implemented yet
     Phase 7  Medical Evidence Search      → not implemented yet
     Phase 10 Appeal Letter Generation     → not implemented yet
     Phase 11 FHIR Payload                 → not implemented yet

   Locked stages stay locked. They render as structural placeholders and must
   not imply that any analysis has been performed.
   ========================================================================= */

export type StepId =
  | "upload"
  | "extraction"
  | "graph"
  | "evidence"
  | "appeal"
  | "fhir";

export interface StepDefinition {
  id: StepId;
  index: number;
  title: string;
  /** Implementation phase in implementation/implementation_plan.md. */
  phase: string;
  /** Short description of what the stage does, shown in the stepper. */
  summary: string;
  /** `ready` stages can be executed; `locked` stages are placeholders. */
  availability: "ready" | "locked";
}

export const PIPELINE_STEPS: readonly StepDefinition[] = [
  {
    id: "upload",
    index: 1,
    title: "Document Upload",
    phase: "Phase 4",
    summary: "Ingest the denial letter and extract its text.",
    availability: "ready",
  },
  {
    id: "extraction",
    index: 2,
    title: "Entity Extraction",
    phase: "Phase 5",
    summary: "Identify diagnosis, procedure and denial entities.",
    availability: "ready",
  },
  {
    id: "graph",
    index: 3,
    title: "Graph Reasoning",
    phase: "Phase 6",
    summary: "Evaluate payer policy rules against the case record.",
    availability: "locked",
  },
  {
    id: "evidence",
    index: 4,
    title: "Medical Evidence Search",
    phase: "Phase 7",
    summary: "Retrieve supporting literature from the vector index.",
    availability: "locked",
  },
  {
    id: "appeal",
    index: 5,
    title: "Appeal Letter Generation",
    phase: "Phase 10",
    summary: "Draft an evidence-backed appeal for human review.",
    availability: "locked",
  },
  {
    id: "fhir",
    index: 6,
    title: "FHIR Payload",
    phase: "Phase 11",
    summary: "Emit a machine-readable FHIR R4 bundle.",
    availability: "locked",
  },
] as const;

export type StageStatus = "idle" | "processing" | "complete" | "error";

export interface PipelineState {
  activeStep: StepId;
  upload: UploadResponse | null;
  extraction: ExtractionResponse | null;
  statuses: Record<StepId, StageStatus>;
  errors: Partial<Record<StepId, string>>;
}

const initialState: PipelineState = {
  activeStep: "upload",
  upload: null,
  extraction: null,
  statuses: {
    upload: "idle",
    extraction: "idle",
    graph: "idle",
    evidence: "idle",
    appeal: "idle",
    fhir: "idle",
  },
  errors: {},
};

type Action =
  | { type: "navigate"; step: StepId }
  | { type: "upload/start" }
  | { type: "upload/success"; payload: UploadResponse }
  | { type: "upload/failure"; message: string }
  | { type: "extraction/start" }
  | { type: "extraction/success"; payload: ExtractionResponse }
  | { type: "extraction/failure"; message: string }
  | { type: "reset" };

function reducer(state: PipelineState, action: Action): PipelineState {
  switch (action.type) {
    case "navigate":
      return { ...state, activeStep: action.step };

    case "upload/start":
      return {
        ...state,
        activeStep: "upload",
        statuses: { ...state.statuses, upload: "processing" },
        errors: { ...state.errors, upload: undefined },
      };

    case "upload/success":
      return {
        ...state,
        upload: action.payload,
        statuses: { ...state.statuses, upload: "complete" },
        errors: { ...state.errors, upload: undefined },
        // Advance to the next ready stage so the user keeps moving forward.
        activeStep: state.activeStep === "upload" ? "extraction" : state.activeStep,
      };

    case "upload/failure":
      return {
        ...state,
        statuses: { ...state.statuses, upload: "error" },
        errors: { ...state.errors, upload: action.message },
      };

    case "extraction/start":
      return {
        ...state,
        activeStep: "extraction",
        statuses: { ...state.statuses, extraction: "processing" },
        errors: { ...state.errors, extraction: undefined },
      };

    case "extraction/success":
      return {
        ...state,
        extraction: action.payload,
        statuses: { ...state.statuses, extraction: "complete" },
        errors: { ...state.errors, extraction: undefined },
      };

    case "extraction/failure":
      return {
        ...state,
        statuses: { ...state.statuses, extraction: "error" },
        errors: { ...state.errors, extraction: action.message },
      };

    case "reset":
      return initialState;

    default:
      return state;
  }
}

interface PipelineContextValue extends PipelineState {
  navigate: (step: StepId) => void;
  submitDocument: (file: File, useModel?: boolean) => Promise<UploadResponse | null>;
  runExtraction: (useModel?: boolean) => Promise<ExtractionResponse | null>;
  reset: () => void;
  /** True once a document exists — gates the extraction stage. */
  hasDocument: boolean;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const client = useApiClient();

  const navigate = useCallback((step: StepId) => {
    dispatch({ type: "navigate", step });
  }, []);

  const submitDocument = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      dispatch({ type: "upload/start" });
      try {
        const result = await client.uploadDocument(file);
        dispatch({ type: "upload/success", payload: result });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed unexpectedly.";
        dispatch({ type: "upload/failure", message });
        return null;
      }
    },
    [client],
  );

  const runExtraction = useCallback(
    async (useModel = false): Promise<ExtractionResponse | null> => {
      if (!state.upload) return null;
      dispatch({ type: "extraction/start" });
      try {
        const result = await client.runExtraction(state.upload.document_id, useModel);
        dispatch({ type: "extraction/success", payload: result });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Extraction failed unexpectedly.";
        dispatch({ type: "extraction/failure", message });
        return null;
      }
    },
    [client, state.upload],
  );

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo<PipelineContextValue>(
    () => ({
      ...state,
      navigate,
      submitDocument,
      runExtraction,
      reset,
      hasDocument: state.upload !== null,
    }),
    [state, navigate, submitDocument, runExtraction, reset],
  );

  return (
    <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>
  );
}

export function usePipeline(): PipelineContextValue {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error("usePipeline must be used inside <PipelineProvider>");
  }
  return context;
}