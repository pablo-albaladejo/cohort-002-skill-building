# Tool Call Memory Creation

LLM uses tool calls during conversation to create memories in real-time.

## Approach

On message:

1. Define `createMemory` tool in LLM tools array
2. LLM calls tool when it learns something worth remembering
3. Tool handler saves memory to DB immediately
4. Memory available in next message's context

## Pros

- Intentional - LLM decides what's worth remembering
- Real-time - memories created during conversation
- Transparent - user sees when memories created (if shown in UI)
- Flexible - can include metadata, categories, etc in tool params

## Cons

- Relies on LLM judgment for when to remember
- May miss memories if LLM doesn't call tool
- Tool calls add latency
- More complex than automatic extraction

## When to Use

- Want LLM control over memory creation timing
- Need granular memory creation during conversation
- Want to capture specific memory types (facts vs preferences vs tasks)
- Building transparent memory systems where user sees what's saved
