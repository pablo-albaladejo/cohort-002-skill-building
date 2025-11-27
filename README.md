# Build a Personal Assistant in TypeScript

[![personal-assistant-github@2x](https://github.com/user-attachments/assets/6b7f0ddb-2f74-4bbf-817a-c2c20a67a246)](https://www.aihero.dev/cohorts/build-your-own-ai-personal-assistant-in-typescript)


Repository for the [5-day cohort course](https://www.aihero.dev/cohorts/build-your-own-ai-personal-assistant-in-typescript) on building production AI systems with retrieval, memory, evals, and human-in-the-loop patterns.

## Prerequisites

- [Node.js](https://nodejs.org/en/download) (version 22 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn/bun
- AI SDK v5 knowledge (prerequisite)
- API keys for AI providers:
  - [OpenAI](https://platform.openai.com/api-keys) (GPT-4, GPT-3.5)
  - [Anthropic](https://console.anthropic.com/) (Claude)
  - [Google AI Studio](https://aistudio.google.com/apikey) (Gemini)

## Quick Start

1. **Clone this repository:**

```bash
git clone https://github.com/mattpocock/cohort-002-skill-building.git
cd cohort-002-skill-building
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Configure your environment:**

```bash
cp .env.example .env
```

4. **Add your API keys to `.env`** and you're ready to start!

## Course Structure

### Day 1-2: Retrieval (Sections 01-04)

- BM25 keyword search, embeddings, rank fusion, query rewriting
- Chunking (fixed-size vs structural), reranking
- Agentic search, metadata-first patterns

### Day 3: Memory (Sections 05-06)

- Semantic and episodic memory
- Working memory with infinite conversations
- CRUD operations on memory store

### Day 4: Evals (Sections 07-08)

- Evalite framework testing
- Deterministic scorers, LLM-as-judge
- A/B testing models and prompts

### Day 5: Human-in-the-Loop (Sections 09-10)

- Approval flows for destructive actions
- Thread-scoped permissions
- MCP server integrations

## Running Exercises

Start by running `pnpm dev`:

```bash
pnpm dev
```

This will allow you to choose between the different course sections.

You can also run `pnpm exercise <exercise-number>` to jump to a specific exercise.

## Exercise Structure

```
exercises/
├── 01-retrieval-skill-building/ (6 exercises)
├── 02-retrieval-project-work/ (3 exercises)
├── 03-retrieval-day-2-skill-building/ (5 exercises)
├── 04-retrieval-day-2-project-work/ (4 exercises)
├── 05-memory-skill-building/ (4 exercises)
├── 06-memory-project-work/ (3 exercises)
├── 07-evals-skill-building/ (6 exercises)
├── 08-evals-project-work/ (2 exercises)
├── 09-human-in-the-loop-skill-building/ (6 exercises)
└── 10-human-in-the-loop-project-work/ (3 exercises)
```

Each exercise follows this learning structure:

### `problem/` folder

- **Your coding playground** - Start here!
- Contains `readme.md` with detailed instructions
- Code files with `TODO` comments for you to implement

### `solution/` folder

- **Reference implementation** - Check when you're stuck
- Complete, working code for each exercise
- Great for comparing approaches and learning best practices

### `explainer/` folder

- **Deep dives** - Additional explanations and concepts
- Extended walkthroughs of complex topics
- Perfect for reinforcing your understanding

## Tech Stack

- **AI SDK v5** - Core LLM interactions
- **React 19 + Vite** - Frontend
- **Hono** - Backend API framework
- **okapibm25, embeddings** - Retrieval techniques
- **Evalite** - Testing framework
- **OpenAI, Anthropic, Google** - AI providers

## Datasets

- `datasets/emails.json` - Email corpus (75-547 emails)
- `datasets/total-typescript-book.md` - TypeScript documentation
- Custom dataset support via Gmail mbox export

## Getting Help

1. **Check the solution** - Each exercise has a completed version
2. **Verify your setup** - Ensure API keys and dependencies are correct
3. **Visit the course** - Full explanations available on [aihero.dev](https://www.aihero.dev/cohorts/build-your-own-ai-personal-assistant-in-typescript)
