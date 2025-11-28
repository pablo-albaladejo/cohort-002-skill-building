Your application uses the following stack:

- [Next.js](https://nextjs.org/) – full-stack React framework by [Vercel](https://vercel.com/)
- [AI SDK](https://www.aihero.dev/workshops/ai-sdk-v5-crash-course) – LLM interaction and streaming
- [Gemini 2.5 Flash](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash) – default model (easily swappable)
- JSON files – data persistence (no database setup required)
- Real-time chat interface with memory management and email search

## Steps To Complete

### Understand the Project Structure

- [ ] Run `pnpm install` to install all dependencies

- [ ] Run `pnpm dev` to start the development server

- [ ] Open [localhost:3000](http://localhost:3000) in your browser to see the UI

Explore what's already built: the chat interface on the left, the memories section with the plus button, and the data tab at the bottom.

### Explore the Email Dataset

- [ ] Navigate to `data/emails.json` and open it

This contains 547 pre-generated emails for a fictional person named Sarah Chen. The data includes varying lengths, topics, and automated content to feel realistic.

- [ ] Use the UI's data tab to search through the emails

This lets you understand the dataset and test retrieval algorithms without calling the LLM.

### Review the Main Application File

- [ ] Open `app/page.tsx` (the main front page)

This is where the app loads chats and memories, and renders the sidebar, top bar, and chat component.

- [ ] Understand the basic persistence hooks

Look for functions like `loadChats()`, `saveChats()`, and `createChats()`. These all write to a single JSON file instead of a database.

### Study the Core Chat Logic

- [ ] Open `app/api/chat/route.ts`

This is the most important file in the codebase. The `POST` function here is where most of your work will happen.

- [ ] Find the `createUIMessageStream()` wrapper

This handles generating chat titles, appending messages, and persisting data.

- [ ] Locate the `streamText()` call

This is where the LLM generates responses and writes them to the UI message stream. Currently using Gemini 2.5 Flash, but you can switch models here.

### Understand the Component Architecture

- [ ] Explore the component files that make up the UI

Review the sidebar component, top bar component, and chat component to see how the interface is structured.

- [ ] Check how the `useChat()` hook is being used

This hook manages chat state and persistence - it's what you learned about in the AI SDK crash course.

### Explore the Persistence Layer

- [ ] Open the persistence layer functions (look for `loadChats`, `saveChats`, etc.)

Understand that these currently use JSON file operations, but could easily be swapped out for [Postgres](https://www.postgresql.org/) or similar in production.

- [ ] Note what would need to change to move to a real database

This will help you understand the architecture's flexibility for production deployments.
