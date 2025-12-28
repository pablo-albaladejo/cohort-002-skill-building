# Project Structure & Organization

## Root Directory Layout

```
├── exercises/           # Main learning content organized by sections
├── datasets/           # Training data (emails.json, total-typescript-book.md)
├── shared/             # Reusable utilities across exercises
├── data/               # Runtime data storage (embeddings cache, etc.)
├── _archived/          # Completed solutions from previous runs
└── internal/           # Course development and meta files
```

## Exercise Organization Pattern

```
exercises/
├── 00-before-we-start/     # Setup and prerequisites
├── 01-retrieval-skill-building/    # BM25, embeddings, rank fusion
├── 02-retrieval-project-work/      # Apply retrieval to assistant
├── 03-retrieval-day-2-skill-building/  # Chunking, reranking
├── 04-retrieval-day-2-project-work/    # Advanced retrieval patterns
├── 05-memory-skill-building/       # Memory CRUD, semantic recall
├── 06-memory-project-work/         # Working & episodic memory
├── 07-evals-skill-building/        # Evalite, scorers, A/B testing
├── 08-evals-project-work/          # Memory & agent evaluation
├── 09-human-in-the-loop-skill-building/  # HITL patterns
└── 10-human-in-the-loop-project-work/    # Approval flows, permissions
```

## Individual Exercise Structure

Each exercise follows this pattern:

- `problem/` - Your coding workspace with TODOs
- `solution/` - Reference implementation
- `explainer/` - Deep dive explanations and concepts
- `explainer/diffs/` - Step-by-step code changes (project exercises)

## File Naming Conventions

- Exercise folders: `XX.YY-descriptive-name/`
- Numbered progression within sections (01, 02, 03...)
- Kebab-case for all folder and file names
- TypeScript files use `.ts` extension (no `.js`)

## Shared Utilities

- `shared/create-ui-message-fixture.ts` - Test message creation
- `shared/run-local-dev-server.ts` - Vite + Hono dev server setup
- Import via `#shared/*` path mapping

## Data Storage Patterns

- `datasets/` - Static training data, version controlled
- `data/` - Runtime cache (embeddings, etc.), gitignored
- Exercise-local storage in `problem/` folders when needed
