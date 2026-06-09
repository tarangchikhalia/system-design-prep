# System Design Prep

AI-assisted system design interview preparation tool.

## Overview

System design is a core skill for software engineers. This tool helps you prepare for system design interviews by providing AI-assisted practice and feedback. You are presented with a challenge and must design a solution within a given time constraint, with an AI interviewer guiding the conversation.

## Features

- Browse and filter system design challenges by difficulty and topic
- AI-generate custom challenges from a short description
- Chat with an AI interviewer that asks clarifying questions and evaluates your design
- Draw architecture diagrams with an integrated Excalidraw canvas
- Attach diagrams to chat messages for AI analysis
- Session timer to simulate real interview conditions
- User profile (onboarding) to personalize the experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (full-stack) |
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | SQLite (`better-sqlite3`) |
| AI | OpenAI API (`gpt-4o`) |
| Diagramming | Excalidraw |

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Backend

```bash
npm install
export OPENAI_API_KEY=your_key_here
npm run server        # http://localhost:3000
```

### Frontend

```bash
cd ui
npm install
npm run dev           # http://localhost:5173
```

### Both together

```bash
# From the repo root
export OPENAI_API_KEY=your_key_here
npm run dev
```

## API Reference

All endpoints are prefixed with `/api`.

### Challenges

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/challenges` | List challenges. Query params: `page`, `limit`, `difficulty`, `topic` |
| `GET` | `/challenges/:id` | Get a single challenge |
| `POST` | `/generate-challenge` | AI-generate a challenge. Body: `{ prompt: string }` |
| `PUT` | `/challenges/:id` | Update a challenge |
| `DELETE` | `/challenges/:id` | Delete a challenge |

### Sessions & Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions` | Create a session. Body: `{ challengeId: number }` |
| `PATCH` | `/sessions/:id/end` | End a session |
| `POST` | `/chat` | Stream AI response (SSE). Body: `{ message, history, challengeContext?, sessionId?, diagram? }` |

### User Context

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/user-context` | Fetch user profile |
| `POST` | `/user-context` | Save user profile. Body: `{ name, current_role, desired_role, purpose }` |
