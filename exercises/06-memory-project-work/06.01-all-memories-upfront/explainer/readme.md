# All Memories Upfront

Simplest memory approach: load entire memory DB, pass to LLM in system prompt.

## Approach

On message:
1. Load all memories from DB
2. Format as text
3. Include in system prompt
4. After response, extract/save new memories, updates, deletions

## Pros

- Simple
- LLM has complete context
- No retrieval needed

## Cons

- Impractical as DB grows
- Wastes context on irrelevant memories
- Higher cost/latency w/ large sets

## When to Use

- Small/medium DBs (<50-100 memories)
- All context frequently relevant
- Prototyping before sophisticated retrieval
