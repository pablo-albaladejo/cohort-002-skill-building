# All Memories Upfront

## Learning Goals

Load entire memory DB and inject into LLM system prompt. Simplest memory approach - no retrieval, no filtering. Apply Section 03 concepts to project repo. Understand tradeoffs: simple but doesn't scale, uses context on irrelevant memories.

## Steps To Complete

### 1. Load All Memories in Chat Route

Fetch complete memory DB at start of request.

**Implementation (`src/app/api/chat/route.ts` in project repo):**

```ts
import { loadMemories } from "@/lib/persistence-layer";

export async function POST(req: Request) {
  // ... existing validation code ...

  const memories = await loadMemories();

  console.log(`Loaded ${memories.length} memories`);
```

**Notes:**

- `loadMemories()` returns `DB.Memory[]` from persistence layer
- Each memory has `id`, `title`, `content`, `createdAt`, `updatedAt`
- Loads ALL memories - no filtering/retrieval yet

### 2. Format Memories as Text

Convert memory objects to human-readable format for LLM.

**Implementation:**

```ts
const formatMemory = (memory: DB.Memory) => {
  return [
    `Title: ${memory.title}`,
    `Content: ${memory.content}`,
    `Created: ${memory.createdAt}`,
  ].join('\n');
};

const memoriesText = memories
  .map(formatMemory)
  .join('\n\n---\n\n');

console.log('Formatted memories:\n', memoriesText);
```

**Notes:**

- Simple text format, easy for LLM to parse
- Separator (`---`) helps LLM distinguish between memories
- Include metadata (created date) for temporal context

### 3. Inject Memories into System Prompt

Pass memories as part of system prompt to give LLM context.

**Implementation:**

```ts
const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // ... existing title generation code ...

    const result = streamText({
      model: anthropic("claude-3-5-haiku-latest"),
      system: `You are a helpful personal assistant.

The user has shared the following memories with you:

<memories>
${memoriesText}
</memories>

Use these memories to provide personalized responses.`,
      messages: convertToModelMessages(messages),
    });

    writer.merge(
      result.toUIMessageStream({
        sendSources: true,
        sendReasoning: true,
      })
    );
```

**Notes:**

- XML tags (`<memories>`) help LLM identify memory section
- System prompt instructs LLM to use memories for personalization
- All memories passed every request - simple but token-heavy

### 4. Test with Manual Memory Creation

Use existing UI to create memories, verify LLM uses them.

**Testing steps:**

1. Run project: `pnpm dev` in `ai-personal-assistant` repo
2. Navigate to memories page (sidebar)
3. Create test memory:
   - Title: "Favorite color"
   - Content: "User's favorite color is blue"
4. Start new chat, ask: "What's my favorite color?"
5. Verify LLM responds with "blue" from memory

**Notes:**

- Memory creation already implemented via UI (`add-memory-button.tsx`)
- Persistence layer (`createMemory`) handles storage
- This lesson focuses on memory retrieval/usage, not creation

## Additional Notes

**When This Approach Works:**

- Small memory DBs (<50-100 memories)
- All context frequently relevant
- Prototyping before sophisticated retrieval

**Limitations:**

- Doesn't scale - large DBs waste context window
- High token cost for irrelevant memories
- No relevance filtering

**Next Steps:**

- 04.02: Tool-controlled memory creation
- 04.03: Automatic memory extraction
- 04.05: Semantic recall (retrieve only relevant memories)
