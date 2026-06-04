# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-assisted system design interview prep tool. Users are presented with system design challenges, can chat with the AI to explore the problem, receive feedback on their solution, and present diagrams or code snippets as part of their answer.

## Planned Tech Stack

- **Language**: TypeScript (full-stack)
- **Frontend**: React
- **Backend**: Node.js
- **Database**: SQLite
- **AI Framework**: LangChain

## Architecture Intent

The application has two main concerns:

1. **Challenge management** — searching/browsing system design challenges by skill level, presenting challenge prompts, and tracking session state.
2. **AI-assisted interaction** — a conversational interface backed by LangChain that can ask clarifying questions, evaluate solutions, and provide feedback.

The AI layer (LangChain) sits on the backend and exposes chat/feedback endpoints to the React frontend. SQLite stores challenges, user sessions, and conversation history.

## Development Setup

### Root (backend + orchestration)

```bash
npm install           # install backend dependencies
npm run server        # start backend with nodemon (http://localhost:3000)
npm run dev           # start both server and UI concurrently
```

TypeScript compilation uses `ts-node` with `tsconfig.json` at the root. The config uses `"module": "CommonJS"` + `"ignoreDeprecations": "6.0"` to satisfy TypeScript 6 while keeping CJS compatibility.

### Frontend (`ui/`)

```bash
cd ui
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build locally
```
