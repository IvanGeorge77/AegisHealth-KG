# AegisHealth-KG — Frontend

Evidence-first clinical investigation workspace for insurance denial analysis.
This is the Phase 12 frontend, living in its own folder so it never entangles
with the Python backend.

Design principle: **evidence, made legible.** Editorial typography, warm paper
surfaces, restrained colour. Structure and type carry the hierarchy; colour is
reserved for status only.

---

## Quickstart

```bash
cd ui
npm install
npm run dev            # http://localhost:5173
```

By default the UI runs against **fictional mock data** and makes no network
requests. To talk to the real backend:

```bash
# terminal 1 — the API
uvicorn src.aegis.api.main:app --reload

# terminal 2 — the UI, with Vite proxying /api → localhost:8000
cd ui && npm run dev
```

Then flip the **Mock data / Live API** switch in the top bar. No rebuild needed.

### Production build

```bash
npm run build          # → ui/dist
npm run preview
```

To serve `dist/` from FastAPI, mount it in `src/aegis/api/main.py` (see
[Backend integration](#backend-integration)).

---

## Data sources

The single most important design decision in this app: **mock data is never
silently mixed with live data.**

| File | Role |
|---|---|
| `src/api/live.ts` | Real `fetch()` calls to FastAPI. Endpoints: upload (Phase 4), extract (Phase 5). |
| `src/api/mock.ts` | Fictional responses with identical shapes and simulated latency. |
| `src/api/config.ts` | The only place that reads `import.meta.env`. |
| `src/api/index.ts` | Facade. Components never import `live.ts`/`mock.ts` directly. |
| `src/state/data-source.tsx` | React context holding the active mode. |

The active source is displayed in the top bar at all times.

### Environment

Copy `.env.example` → `.env.local`.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` | `mock` or `live` |
| `VITE_API_BASE_URL` | *(empty)* | Empty = same origin, uses the Vite proxy. Set absolute only if you also add CORS. |

---

## The pipeline (the core of the app)

`/cases/new` is the case workspace: a persistent stepper on the left, a dynamic
content area on the right.

| # | Stage | Phase | Status | Endpoint |
|---|---|---|---|---|
| 1 | Document Upload | 4 | **Live** | `POST /api/v1/documents/upload` |
| 2 | Entity Extraction | 5 | **Live** | `POST /api/v1/documents/{document_id}/extract` |
| 3 | Graph Reasoning | 6 | Locked | *(none yet)* |
| 4 | Medical Evidence Search | 7 | Locked | *(none yet)* |
| 5 | Appeal Letter Generation | 10 | Locked | *(none yet)* |
| 6 | FHIR Payload | 11 | Locked | *(none yet)* |

Locked stages render structural placeholders only. They never show invented
results — a plausible-looking analysis that has not been computed would
misrepresent the state of the system.

### Where to add each future phase

| Phase | File to implement | Backend route to create |
|---|---|---|
| 6 — Graph | `components/pipeline/steps/step-graph-reasoning.tsx` | `api/routes/retrieval.py` |
| 7 — Evidence | `components/pipeline/steps/step-evidence-search.tsx` | `api/routes/retrieval.py` |
| 10 — Appeal | `components/pipeline/steps/step-appeal-letter.tsx` | `api/routes/appeals.py` |
| 11 — FHIR | `components/pipeline/steps/step-fhir-payload.tsx` | `api/routes/fhir.py` |

When a route exists: add the method to `src/api/live.ts`, add the matching
client to `src/api/mock.ts`, flip `availability` to `"ready"` in
`PIPELINE_STEPS` (`src/state/pipeline.tsx`), and replace the placeholder body.
Nothing else needs to change.

---

## Project structure

```
ui/src/
├── main.tsx                 Entry: BrowserRouter + providers
├── App.tsx                  Routes and provider composition
├── index.css                Design tokens (@theme), base styles, utilities
│
├── api/                     Data layer — the only place that does I/O
│   ├── config.ts            Env reading, upload limits
│   ├── live.ts              fetch() → FastAPI
│   ├── mock.ts              Fictional responses, same shapes
│   └── index.ts             Facade
│
├── state/                   React state
│   ├── data-source.tsx      Active mode (mock | live) + client
│   └── pipeline.tsx         Six-stage pipeline store (reducer)
│
├── types/
│   ├── api.ts               Mirrors the Pydantic response models
│   └── domain.ts            Case, requirement, evidence, appeal types
│
├── data/demo.ts             Fictional cases, requirements, evidence
│
├── components/
│   ├── ui/                  shadcn-style primitives (button, badge, card…)
│   ├── layout/              AppShell, NavRail, TopBar, page furniture
│   ├── common/              Status vocabulary, placeholders, notices
│   └── pipeline/            Stepper, step shell, the six step panels
│
└── pages/
    ├── overview-page.tsx    "Cases requiring attention"
    ├── cases-page.tsx       Case register
    ├── case-workspace-page.tsx   Stepper + active step
    └── pending-pages.tsx    Evidence / Policies / Graph / Appeals / 404
```

---

## Design system

Tokens live in `src/index.css` under Tailwind v4's `@theme`, so they are
consumable as ordinary utilities (`bg-paper`, `text-denial`, `font-serif`).

| Role | Token | Value |
|---|---|---|
| Primary ink | `ink` | `#222823` |
| Primary action | `forest` | `#315C48` |
| App background | `paper` | `#F4F1E8` |
| Document surface | `surface` | `#FFFEFA` |
| Borders | `stone` | `#DCD9CF` |
| Secondary text | `slate` | `#526174` |
| Critical / denial | `denial` | `#AD4E3B` |
| Pending review | `ochre` | `#B38A42` |
| Nav rail | `rail` | `#1E2A24` |

Type: **Newsreader** (display/editorial), **IBM Plex Sans** (UI), **IBM Plex
Mono** (codes, IDs, DOIs, timestamps).

Utility classes worth reusing rather than restyling ad hoc: `ak-label`,
`ak-mono`, `ak-surface`, `ak-rule-editorial`, `ak-scroll`, `ak-grain`.

### Rules the UI follows

- **Status is never colour alone.** Every status badge pairs colour with an
  icon and an explicit word.
- **Facts vs. interpretation.** Document-derived values are quoted and cited;
  model output is labelled as generated.
- **Absence is stated honestly.** Nothing pre-filled, no fabricated results,
  disabled controls say why they are disabled.
- **Case presence ≠ requirement satisfied.** Only a citation may mark a
  requirement verified.

---

## Accessibility & responsiveness

- Desktop-first, since this is a document-heavy workspace. Multi-panel layouts
  collapse to a single column; the stepper becomes a horizontal scroller below
  `lg`, the nav rail becomes a top scroller below `md`.
- Full keyboard support, including the drop zone (labelled file input).
- Visible focus rings, `aria-current` on the active step, live regions for
  errors, `prefers-reduced-motion` honoured globally.

---

## Backend integration

FastAPI currently has no CORS middleware. The dev server proxies `/api` to
`http://localhost:8000`, which keeps the browser on one origin and avoids
touching the API for the sake of the UI.

To serve the built UI from FastAPI (optional, additive):

```python
from pathlib import Path
from fastapi.staticfiles import StaticFiles

ui_dist = Path(__file__).resolve().parents[3] / "ui" / "dist"
if ui_dist.exists():
    app.mount("/", StaticFiles(directory=ui_dist, html=True), name="ui")
```

Mount it **after** the routers are included so `/api/*` and `/health` keep
priority. For a client-side-routed app, add a catch-all that returns
`index.html` for unmatched paths.