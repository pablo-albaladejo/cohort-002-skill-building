# Tool Call Memory Creation

## Learning Goals

LLM controls memory creation timing via tool calls. Agent decides when info worth remembering during conversation. Apply Section 03.03 concepts to project repo. Real-time, transparent, flexible approach.

## Steps To Complete

### 1. Load Memories (Already Done)

Memory loading already implemented in 04.01. Skip if done.

**Implementation (`src/app/api/chat/route.ts`):**

```ts
import { loadMemories } from '@/lib/persistence-layer';

const memories = await loadMemories();
const memoriesText = memories
  .map(
    (m) =>
      `Title: ${m.title}\nContent: ${m.content}\nID: ${m.id}`,
  )
  .join('\n\n---\n\n');
```

**Notes:**

- Include ID in formatted output for reference
- Memories injected into system prompt with XML tags

### 2. Define Memory CRUD Tools

Add three tools to `streamText` config for LLM-controlled memory operations.

**Implementation (`src/app/api/chat/route.ts`):**

```ts
import { stepCountIs, tool } from 'ai';
import { z } from 'zod';
import {
  createMemory,
  updateMemory,
  deleteMemory,
} from '@/lib/persistence-layer';

const result = streamText({
  model: anthropic('claude-3-5-haiku-latest'),
  system: `You are a helpful personal assistant.

Date: ${new Date().toISOString().split('T')[0]}

<memories>
${memoriesText}
</memories>

Memory management guidelines:
- CREATE: user shares new personal info, preferences, facts for long-term
- UPDATE: user contradicts/refines existing memory
- DELETE: memory becomes outdated/irrelevant
- SKIP: casual small talk, temporary/situational info`,
  messages: convertToModelMessages(messages),
  tools: {
    createMemory: tool({
      description:
        'Create new permanent memory when user shares personal information',
      inputSchema: z.object({
        title: z.string().describe('Short title summarizing memory'),
        content: z.string().describe('Detailed memory content'),
      }),
      execute: async ({ title, content }) => {
        console.log('Creating memory:', { title, content });

        const memory = await createMemory({
          id: crypto.randomUUID(),
          title,
          content,
        });

        return {
          success: true,
          memoryId: memory.id,
        };
      },
    }),
    updateMemory: tool({
      description:
        'Update existing memory when user provides contradictory or refined information',
      inputSchema: z.object({
        id: z.string().describe('ID of memory to update'),
        title: z.string().describe('Updated title'),
        content: z.string().describe('Updated content'),
      }),
      execute: async ({ id, title, content }) => {
        console.log('Updating memory:', { id, title, content });

        const memory = await updateMemory(id, { title, content });

        if (!memory) {
          return { success: false, error: 'Memory not found' };
        }

        return {
          success: true,
          memoryId: memory.id,
        };
      },
    }),
    deleteMemory: tool({
      description:
        'Delete memory when it becomes outdated or irrelevant',
      inputSchema: z.object({
        id: z.string().describe('ID of memory to delete'),
      }),
      execute: async ({ id }) => {
        console.log('Deleting memory:', { id });

        const success = await deleteMemory(id);

        if (!success) {
          return { success: false, error: 'Memory not found' };
        }

        return { success: true };
      },
    }),
  },
  stopWhen: stepCountIs(5), // Already present from section 2
});
```

**Notes:**

- Three tools for full CRUD operations
- `inputSchema` uses Zod for type safety
- `updateMemory` and `deleteMemory` already exist in persistence layer
- Include memory IDs in formatted output for LLM reference
- System prompt guides when to use each operation
- Console logs for debugging tool calls

### 3. Test CRUD Tool Flow

Verify LLM calls appropriate tools for create/update/delete operations.

**Testing steps:**

1. Run: `pnpm dev` in `ai-personal-assistant` repo
2. **Test create**: "My favorite programming language is TypeScript"
   - Check console: `Creating memory: { title: ..., content: ... }`
   - Verify tool call in UI
   - Refresh memories page - see new memory
3. **Test update**: "Actually, I prefer Python over TypeScript"
   - Check console: `Updating memory: { id: ..., title: ..., content: ... }`
   - Verify memory page shows updated content
4. **Test delete**: "I don't care about programming languages anymore"
   - Check console: `Deleting memory: { id: ... }`
   - Verify memory removed from page
5. **Test recall**: Start new chat, ask: "What's my favorite language?"
   - Verify LLM uses updated/current memories

**Notes:**

- Tool calls visible in message parts if UI configured
- Memory operations immediately reflected in `loadMemories()` for next request
- LLM decides timing and which operation to use
- Test negative case: casual chat shouldn't trigger tools

### 4. Handle Edge Cases

Test scenarios where tool behavior matters.

**Scenarios:**

1. **Duplicate info**: LLM should skip if already in memories
2. **Multiple operations**: Share 3 facts, contradict 1 - verify mixed tool calls
3. **Situational vs permanent**: "I'm at the gym" shouldn't trigger tool
4. **Explicit request**: "Remember that I like coffee" should trigger create
5. **Update vs create**: Contradictory info should update, not create duplicate
6. **Delete timing**: Outdated info should trigger delete tool

**Notes:**

- System prompt guides LLM decision on which tool to use
- Monitor console logs to verify correct tool selection
- Adjust prompt if LLM over/under-triggers tools or picks wrong operation
- IDs in memory formatting critical for update/delete operations

## Additional Notes

**When This Approach Works:**

- Want LLM control over memory timing
- Transparent system showing what's saved
- Need flexibility in memory metadata
- Building agent-driven workflows

**Limitations:**

- Relies on LLM judgment for which tool to call
- May miss operations if LLM doesn't call tools
- Requires IDs in memory formatting for update/delete
- LLM may choose wrong operation (update vs create, etc)

**Comparison to Other Approaches:**

- 04.02 (this lesson): LLM-controlled tools, real-time, transparent, flexible timing
- 04.03: Automatic extraction via `onFinish`, comprehensive, every message
- 04.04: User confirmation before saving, maximum control

**Next Steps:**

- 04.03: Automatic memory extraction analyzing full conversation
- 04.04: User-confirmed memories via HITL pattern
- 04.05: Semantic recall for scaling beyond loading all memories
