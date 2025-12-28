# Tech Stack & Build System

## Core Technologies

- **Runtime**: Node.js v22+ with TypeScript
- **Package Manager**: pnpm (preferred), npm/yarn/bun supported
- **AI Framework**: AI SDK v5 for LLM interactions
- **Frontend**: React 19 + Vite for development server
- **Backend**: Hono API framework
- **Testing**: Evalite framework for AI system evaluation, Vitest for unit tests

## Key Dependencies

- **Retrieval**: `okapibm25` (keyword search), `@ai-sdk/openai|anthropic|google` (embeddings)
- **Chunking**: `@langchain/textsplitters` for document processing
- **UI**: `@tailwindcss/vite`, `lucide-react`, `react-markdown`
- **Data**: `drizzle-orm`, `redis`, `papaparse` for datasets
- **Utilities**: `zod` for schemas, `js-tiktoken` for token counting

## Required API Keys

Configure in `.env` (copy from `.env.example`):

- `OPENAI_API_KEY` - GPT-4, GPT-3.5, embeddings
- `ANTHROPIC_API_KEY` - Claude models
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini models

## Common Commands

```bash
# Start exercise selection CLI
pnpm dev

# Jump to specific exercise
pnpm exercise <exercise-number>

# Install dependencies
pnpm install

# Run tests (when available)
pnpm test
```

## Development Patterns

- **Local dev server**: Uses Vite (port 3000) + Hono (port 3001) with proxy
- **Exercise structure**: Each exercise has isolated `client/` and `api/` folders
- **Shared utilities**: Import from `#shared/*` path mapping
- **TypeScript config**: Strict mode enabled with `noUncheckedIndexedAccess`
