<<<<<<< HEAD
# ProcureGuard
=======
# ProcureGuard · Auto-Audit Node

Enterprise procurement approval workflow with a five-agent AI review pipeline,
detailed policy inspection logs, and human-decision escalations. The system is a
**single deployable process**: one Express server serves both the production
React build (`dist/`) and the JSON API (`/api/*`).

---

## Quick start

```bash
# 1) Install
npm install

# 2) Production (builds frontend + server, then runs)
npm start                 # -> http://localhost:4000

# 3) Development (two terminals)
npm run server:dev        # API + (optional) static on :4000, with auto-reload
npm run dev               # Vite dev server on :3000, proxies /api -> :4000
```

Open <http://localhost:3000> in dev or <http://localhost:4000> in production.
On first visit you'll be asked to enter a name — this name is stamped onto every
submission and human-decision you make.

---

## NPM scripts

| Script              | Purpose                                                                 |
|---------------------|-------------------------------------------------------------------------|
| `npm start`         | One-shot deploy: build React, bundle server, run `node server.cjs`.    |
| `npm run dev`       | Vite dev server on `:3000` (HMR).                                       |
| `npm run server:dev`| `tsx watch server.ts` on `:4000` (API + optional static).               |
| `npm run build`     | Vite production build to `dist/`.                                       |
| `npm run server:build` | esbuild bundles `server.ts` to `server.cjs`.                         |
| `npm run preview`   | Vite preview of the built bundle (no API).                              |
| `npm run lint`      | Typecheck the React app (`tsc --noEmit`).                               |
| `npm run lint:server` | Typecheck the server (`tsc -p tsconfig.server.json --noEmit`).       |
| `npm run clean`     | Remove `dist/` and `server.cjs`.                                        |

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Express process (server.cjs)                              │
│  ──────────────────────────────                            │
│   • serves /dist/*  (React production build)               │
│   • serves /api/*   (procurement API, JSON)                │
│   • persists ledger to data.json (auto-recreated if gone)  │
│   • runs the 5-agent pipeline in-process (setTimeout)      │
└────────────────────────────────────────────────────────────┘
                ▲                       ▲
                │ /api/* (poll 3s)      │ /api/requests (POST), PATCH
                │                       │   /api/requests/:id/human-decision
┌───────────────┴───────────────────────┴──────────────────┐
│  React app (Vite build)                                   │
│  ────────────────────                                     │
│   • Auth gate: name prompt -> stored in localStorage      │
│   • Pages: Dashboard, Submit, All Requests, Detail        │
│   • Components: Agent Pipeline Tracker, Audit Trail, ...  │
└────────────────────────────────────────────────────────────┘
```

### Five-agent pipeline (server-side, real-time)

1. **Budget Agent** — department allocation check (~4s)
2. **Vendor Risk Agent** — supplier registry + SOC-2 sweep (~4s)
3. **Compliance Agent** — corporate policy threshold check (~4s)
4. **Manager Approval Agent** — auto-approve / reject / escalate (~4s)
5. **Report Agent** — compile audit PDF (~3s)

Each stage persists to `data.json` so the 3-second polling front-end sees the
request progress from `pending` → `in_review` → terminal status, with audit
trail entries appended at every checkpoint.

---

## API

| Method | Path                                       | Description                        |
|--------|--------------------------------------------|------------------------------------|
| GET    | `/api/health`                              | Service + pipeline health          |
| GET    | `/api/requests`                            | All procurement requests           |
| POST   | `/api/requests`                            | Submit a new request               |
| GET    | `/api/requests/:id`                        | One request + `procurement_context`|
| GET    | `/api/requests/:id/context`                | Band shared context                |
| PATCH  | `/api/requests/:id/human-decision`         | Approve / reject an escalation     |
| GET    | `/api/requests/:id/report`                 | Download audit PDF                 |
| GET    | `/api/departments/budgets`                 | Department budget health           |

---

## Environment variables

Copy `.env.example` to `.env` (or `.env.local`) and adjust as needed.

| Variable                 | Default                  | Purpose                                |
|--------------------------|--------------------------|----------------------------------------|
| `PORT`                   | `4000`                   | Express listen port                    |
| `VITE_API_URL`           | `""` (relative)          | Frontend API base URL                  |
| `VITE_API_PROXY_TARGET`  | `http://localhost:4000`  | Vite dev-proxy target for `/api`       |
| `GEMINI_API_KEY`         | —                        | Reserved (AI Studio integration)       |
| `APP_URL`                | —                        | Reserved (AI Studio integration)       |

> **For production deploys, set `VITE_API_URL=""` (empty)** so the built app
> uses same-origin `/api/...` requests against the Express process.

---

## Deploying

```bash
# Build everything
npm install
npm run build
npm run server:build

# Start (single process, serves app + API)
PORT=4000 node server.cjs
```

Behind a reverse proxy (nginx, Caddy, Cloud Run, Fly.io, etc.), point the
proxy at the Express port and terminate TLS there. The Express process binds
to `0.0.0.0` by default when given a `PORT` env var; pass `--host` if your
runtime requires it.
>>>>>>> cddc8df (Initial Commit)
