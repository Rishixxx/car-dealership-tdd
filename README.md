# Car Dealership Inventory System

A full-stack car dealership inventory kata built with Node.js, Express, TypeScript, PostgreSQL-ready database wiring, JWT auth, and a React SPA frontend.

## Project Structure

- `src/` contains the backend API, database config, migrations, auth middleware, models, routes, validators, and JWT helpers.
- `frontend/` contains the React/Vite single-page app for login, registration, inventory search, purchases, and admin inventory actions.
- `tests/` contains the backend Jest/Supertest suite.

## Local Setup

### Backend

```bash
npm install
npm run migrate
npm run dev
```

The API runs on port `3000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The SPA runs on port `5173` by default and talks to `http://localhost:3000` unless `VITE_API_BASE_URL` is set.

### Useful Root Scripts

```bash
npm run dev:frontend
npm run build:frontend
```

## Tests

### Backend Jest Coverage Summary

Latest run:

- Statements: `89.6%`
- Branches: `72.25%`
- Functions: `93.93%`
- Lines: `89.89%`

Latest backend test run:

- Test suites: `5 passed`
- Tests: `47 passed`

### Frontend Validation

- `cd frontend && npm run build` passes.
- The frontend currently has no separate test suite.

## Screenshots

Add screenshots here after running the app locally.

## My AI Usage

This project was built with help from AI tools, but the code was still shaped through a normal engineering workflow: I started from the existing backend implementation, confirmed the controlling code paths with focused reads, wrote failing tests for the missing vehicle API surface, and then implemented the smallest handlers needed to make those tests pass.

I used AI assistance for a few specific tasks:

- To inspect the existing repository structure and identify the narrowest missing slice instead of reworking the whole codebase.
- To expand the vehicle API coverage into CRUD, search, purchase, and restock flows with a TDD-style contract.
- To scaffold the frontend React/Vite app, including routing, form flows, and the inventory dashboard UI.
- To help draft and refine this README, especially the setup instructions and the AI usage reflection itself.

What AI changed for this project:

- It reduced setup time for boilerplate and cross-cutting glue code.
- It made it easier to keep backend and frontend conventions aligned.
- It also required careful verification, because generated scaffolding still needed real builds and tests to prove it worked.

My reflection:

- The AI assistance was useful for speed and structure, but it did not replace the need to reason about behavior, database shape, and test coverage.
- The strongest result came from using AI as a paired implementation helper while keeping validation strict: run tests, read failures, fix the actual cause, and only then move on.
- For a kata project like this, that balance preserved the TDD feel while still letting the project move at a reasonable pace.

## Deployment

No live deployment link is configured yet.
