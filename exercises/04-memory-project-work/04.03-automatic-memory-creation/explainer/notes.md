# Automatic Memory Creation

## Learning Goals

Automatic memory extraction after each LLM response via `onFinish` callback. Use `generateObject` to analyze conversation and extract CRUD operations. Comprehensive approach - analyzes full context for additions/updates/deletions. Apply Section 03.02 concepts to project repo.

## Steps To Complete

### 1. Extract Memory Extraction Function

Create reusable `extractMemories()` function for memory operations extraction. Makes logic testable/evaluable in Section 06.

**Implementation (`src/lib/extract-memories.ts`):**

```ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { DB, loadMemories } from '@/lib/persistence-layer';
import { UIMessage } from 'ai';

export const memoryOperationsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().describe('ID of existing memory to update'),
      title: z.string().describe('Updated title'),
      content: z.string().describe('Updated content'),
    })
  ).describe('Existing memories to update with new information'),
  deletions: z.array(z.string()).describe('IDs of memories to delete (outdated/irrelevant)'),
  additions: z.array(
    z.object({
      title: z.string().describe('Title for new memory'),
      content: z.string().describe('Content for new memory'),
    })
  ).describe('New memories to create'),
});

export type MemoryOperations = z.infer<typeof memoryOperationsSchema>;

export async function extractMemories(opts: {
  messages: UIMessage[];
  existingMemories: DB.Memory[];
}): Promise<MemoryOperations> {
  const { messages, existingMemories } = opts;

  const memoriesText = existingMemories
    .map(m => `ID: ${m.id}\nTitle: ${m.title}\nContent: ${m.content}`)
    .join('\n\n---\n\n');

  const memoriesResult = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: memoryOperationsSchema,
    system: `Analyze conversation and extract memory operations.

<existing-memories>
${memoriesText || 'No existing memories'}
</existing-memories>

Guidelines:
- ADD: User shares new permanent info (preferences, facts, context)
- UPDATE: User contradicts/refines existing memory
- DELETE: Memory becomes outdated/irrelevant
- SKIP: Casual chat, temporary/situational info

Focus on permanent information, not ephemeral conversation details.`,
    messages,
  });

  return memoriesResult.object;
}
```

**Notes:**

- Extracted function enables evaluation in Section 06
- Schema exported for reuse
- Takes messages + existing memories, returns operations
- Same prompt logic as before

### 2. Use Extracted Function in Route

Call `extractMemories()` in `onFinish` callback.

**Implementation (`src/app/api/chat/route.ts`):**

```ts
import { extractMemories } from '@/lib/extract-memories';
import {
  loadMemories,
  createMemory,
  updateMemory,
  deleteMemory
} from '@/lib/persistence-layer';

const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // ... existing streamText code ...
  },
  generateId: () => crypto.randomUUID(),
  onFinish: async ({ responseMessage }) => {
    await appendToChatMessages(chatId, [responseMessage]);

    const existingMemories = await loadMemories();
    const allMessages = [...messages, responseMessage];

    const memoryOperations = await extractMemories({
      messages: allMessages,
      existingMemories,
    });

    console.log('Memory operations:', memoryOperations);
  },
});
```

**Notes:**

- Much cleaner route code
- Function testable in isolation
- Prepares for evaluation in 06.01

### 3. Execute Memory Operations

Process extracted operations, handling conflicts between updates and deletions.

**Implementation:**

```ts
const { updates, deletions, additions } = memoryOperations;

console.log('Updates:', updates);
console.log('Deletions:', deletions);
console.log('Additions:', additions);

// Filter deletions to exclude IDs being updated (avoid conflicts)
const filteredDeletions = deletions.filter(
  deletion => !updates.some(update => update.id === deletion)
);

// Update existing memories
for (const update of updates) {
  await updateMemory(update.id, {
    title: update.title,
    content: update.content,
  });
  console.log(`Updated memory: ${update.id}`);
}

// Delete outdated memories
for (const deletionId of filteredDeletions) {
  await deleteMemory(deletionId);
  console.log(`Deleted memory: ${deletionId}`);
}

// Create new memories
for (const addition of additions) {
  await createMemory({
    id: crypto.randomUUID(),
    title: addition.title,
    content: addition.content,
  });
  console.log(`Created memory: ${addition.title}`);
}
```

**Notes:**

- Filter deletions before processing - can't delete what's being updated
- Sequential processing ensures operations complete before next request
- Console logs for debugging memory evolution
- `updateMemory` expects `id` + `title`/`content` (from lesson 4.2)

### 4. Test Automatic Extraction Flow

Verify LLM extracts memories automatically after each response.

**Testing steps:**

1. Run: `pnpm dev` in `ai-personal-assistant` repo
2. Share personal info: "My favorite drink is coffee"
3. Check console - should see `Additions: [{ title: ..., content: ... }]`
4. Continue chat with contradiction: "Actually, I prefer tea"
5. Check console - should see `Updates: [{ id: ..., title: ..., content: ... }]`
6. Check memories page - verify update reflected
7. Share irrelevant info: "The weather is nice today"
8. Verify no memory operations (situational info skipped)

**Notes:**

- Memory extraction happens after every response (not just when relevant)
- LLM analyzes full conversation each time
- May miss context if prompt not tuned well
- More token usage than tool approach (04.02)

### 5. Test Edge Cases

Verify behavior in complex scenarios.

**Scenarios:**

1. **Multiple operations**: Share 3 new facts, verify all added
2. **Update + delete same ID**: System filters deletion, only updates
3. **Contradictory updates**: "I like X" → "I hate X" should update, not add
4. **No relevant info**: Casual chat shouldn't trigger operations

**Notes:**

- Deletion filtering prevents conflicts
- LLM should batch related info into single memory
- Console logs essential for debugging LLM decisions
- Adjust system prompt if over/under-extracting

## Additional Notes

**When This Approach Works:**

- Want comprehensive memory extraction without LLM deciding timing
- Prefer simplicity over transparency
- Can afford extra LLM call per message
- Building systems where memory completeness > latency

**Limitations:**

- Happens after response (not real-time)
- User doesn't see memory operations in conversation
- Extra LLM call adds cost/latency every message
- May extract irrelevant info despite prompt tuning
- Less control vs tool-based approach

**Comparison to Other Approaches:**

- 04.02: LLM-controlled tools, real-time, transparent, flexible timing
- 04.03: Automatic extraction, comprehensive, less transparent, every message
- 04.04: User confirmation, maximum control, most friction

**Next Steps:**

- 04.04: User-confirmed memories via approval flow
- 04.05: Semantic recall for scaling beyond loading all memories
