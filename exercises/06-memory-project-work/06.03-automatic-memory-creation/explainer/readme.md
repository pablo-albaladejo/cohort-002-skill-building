# Automatic Memory Creation

Automatically extract/create memories after each LLM response using `generateObject` in `onFinish`.

## Approach

On message:

1. LLM responds to user normally
2. In `onFinish` callback, call `generateObject` with conversation history
3. LLM analyzes conversation, extracts memories (additions/updates/deletions)
4. Save changes to DB automatically
5. Memories available in next conversation

## Pros

- Simple - no tool definitions needed
- Reliable - always runs after response
- Comprehensive - analyzes full conversation context
- Supports updates/deletions, not just additions

## Cons

- Happens after response (not real-time)
- Less transparent - user doesn't see memory creation
- Extra LLM call after each message (cost/latency)
- May extract irrelevant info if prompt not tuned

## When to Use

- Want hands-off memory management
- Don't need real-time memory creation during conversation
- Want comprehensive memory extraction (additions + updates + deletions)
- Prefer simplicity over granular control
