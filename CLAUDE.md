# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-assisted system design interview prep tool. Users are presented with system design challenges, can chat with the AI to explore the problem, receive feedback on their solution, and present diagrams or code snippets as part of their answer.

## Tech Stack

- **Language**: TypeScript (full-stack)
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend**: Node.js, Express 5
- **Database**: SQLite (via `better-sqlite3`)
- **AI**: OpenAI API (`gpt-4o`) — used directly, not via LangChain
- **Diagramming**: Excalidraw

## Architecture

The backend follows a **routes → services** pattern. Routes are thin HTTP controllers; all business logic lives in services.

```
server.ts                          # Express entry point, mounts routers
src/
  db.ts                            # DB init, schema creation, seed data
  shared/
    openai.ts                      # Shared OpenAI client instance
  routes/
    challenges.ts                  # HTTP controllers for challenge endpoints
    chat.ts                        # HTTP controllers for session/chat endpoints
  services/
    challenge/
      challenge.ts                 # All challenge business logic + DB queries
    chat/
      chat.ts                      # All session/chat business logic + DB queries
ui/
  src/
    App.tsx                        # Root component, onboarding gate, routing
    components/
      Home.tsx                     # Challenge browser with search/filter
      Challenge.tsx                # Challenge view with timer
      ChatPanel.tsx                # SSE-based streaming chat interface
      DiagramPanel.tsx             # Excalidraw diagram canvas
      GenerateChallengeDialog.tsx  # AI challenge generation modal
      NavigationBar.tsx            # Top nav with user context
      Onboarding.tsx               # First-run user profile setup
```

## API Endpoints

All routes are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthcheck` | Health check |
| GET | `/user-context` | Fetch user profile |
| POST | `/user-context` | Save user profile |
| GET | `/challenges` | List challenges (supports `page`, `limit`, `difficulty`, `topic` query params) |
| POST | `/generate-challenge` | AI-generate and persist a new challenge |
| GET | `/challenges/:id` | Fetch single challenge |
| PUT | `/challenges/:id` | Update challenge |
| DELETE | `/challenges/:id` | Delete challenge |
| POST | `/sessions` | Create interview session |
| PATCH | `/sessions/:id/end` | End interview session |
| POST | `/chat` | Stream AI chat response (SSE) |

## Database Schema

Three tables in `system-design-prep.db`:

- **challenges** — `id`, `challenge_name`, `description`, `difficulty`, `topics` (JSON string)
- **sessions** — `id`, `challenge_id`, `started_at`, `ended_at`
- **messages** — `id`, `session_id`, `role`, `content`, `has_diagram`, `created_at`

The DB is seeded with 6 challenges on first run if the table is empty.

## Development Setup

### Root (backend)

```bash
npm install           # install backend dependencies
npm run server        # start backend with nodemon (http://localhost:3000)
npm run dev           # start both backend and frontend concurrently
```

TypeScript compilation uses `ts-node` with `tsconfig.json` at the root. The config uses `"module": "CommonJS"` + `"ignoreDeprecations": "6.0"` to satisfy TypeScript 6 while keeping CJS compatibility.

Requires `OPENAI_API_KEY` environment variable.

### Frontend (`ui/`)

```bash
cd ui
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build locally
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.
