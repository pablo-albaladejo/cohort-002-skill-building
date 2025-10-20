# Comparing Semantic Search with Agentic Search

## Learning Goals

- Comparative evaluation using `evalite.each` for variant comparison
- Experiment-driven testing: treat eval as experiment to compare approaches
- Compare upfront retrieval (semantic search) vs tool-based (agentic search)
- Manual answer inspection for correctness (defer LLM-as-judge to next lesson)
- Identify boundary cases where each approach excels/struggles

## Steps To Complete

### 1. Create Test Dataset

Define 8-10 test cases from email dataset. Focus on questions requiring email context + expected answers.

```typescript
const testCases = [
  {
    question: "What's the mortgage pre-approval amount?",
    expectedAnswer: "£350,000"
  },
  {
    question: "Who is Sarah's mortgage advisor and what company do they work for?",
    expectedAnswer: "David Xu from First Home Mortgages"
  },
  // More cases...
]
```

**Include edge cases to test boundaries:**
- **Multi-hop queries**: "Who sent the email about the Chorlton house and what were their concerns about the basement?"
- **Filtering needs**: "What emails did Jennifer send after August 1st?"
- **Thread following**: "What property did Sarah get gazumped on and how did she react?"
- **Simple facts**: "What's the interest rate on Sarah's mortgage?"

These edge cases expose where agents excel (multi-step reasoning, filtering) vs where simple RAG suffices (single fact lookup).

### 2. Implement Semantic Search Variant

Upfront retrieval approach: retrieve all context first, then answer.

```typescript
async function semanticSearchVariant(question: string) {
  // Generate keywords + search query
  const { keywords, searchQuery } = await generateObject({
    model: google.textEmbeddingModel(),
    prompt: `Extract keywords and search query from: ${question}`,
    schema: z.object({
      keywords: z.array(z.string()),
      searchQuery: z.string()
    })
  })

  // Import search algorithm from lesson 2.2
  // BM25 + embeddings + rank fusion
  const results = await searchEmails(keywords, searchQuery)
  const topResults = results.slice(0, 10)

  // Answer with retrieved context
  const answer = await generateText({
    model: anthropic("claude-3-5-haiku-latest"),
    prompt: `
      Context: ${formatEmails(topResults)}

      Question: ${question}

      Answer based only on context provided.
    `
  })

  return answer.text
}
```

**Note:** Import actual search implementation from lesson 2.2 (BM25 + embeddings + RRF).

### 3. Implement Agentic Search Variant

Tool-based approach: LLM decides which tools to call, when.

```typescript
async function agenticSearchVariant(question: string) {
  // Import tools from lesson 2.4
  const tools = {
    searchSemanticEmails: tool({
      description: "Search emails using BM25 + embeddings",
      parameters: z.object({
        keywords: z.array(z.string()),
        query: z.string()
      }),
      execute: async ({ keywords, query }) => {
        // Return metadata only (id, subject, from, to)
        // No full content to encourage follow-up getEmailById
      }
    }),
    filterEmails: tool({
      description: "Filter emails by sender, date, contains text",
      parameters: z.object({
        from: z.string().optional(),
        after: z.string().optional(),
        contains: z.string().optional()
      }),
      execute: async (filters) => {
        // Traditional filtering logic
      }
    }),
    getEmailById: tool({
      description: "Get full email content by ID",
      parameters: z.object({
        id: z.string(),
        includeThread: z.boolean().optional()
      }),
      execute: async ({ id, includeThread }) => {
        // Fetch email, optionally entire thread
      }
    })
  }

  const result = await streamText({
    model: anthropic("claude-3-5-haiku-latest"),
    prompt: question,
    tools,
    stopWhen: stepCountIs(5)
  })

  return result.text
}
```

**Note:** Agent autonomy - LLM chooses semantic vs filter search, metadata scan → targeted retrieval patterns.

### 4. Setup evalite.each Comparison

Use `evalite.each` to run both variants on same test cases side-by-side.

```typescript
import { evalite } from "evalite"

evalite.each([
  { name: "semantic", variant: "semantic" },
  { name: "agentic", variant: "agentic" }
])("Search Approach Comparison", {
  data: async () => testCases,
  task: async (testCase, { variant }) => {
    if (variant === "semantic") {
      return await semanticSearchVariant(testCase.question)
    }
    return await agenticSearchVariant(testCase.question)
  }
})
```

**Key insight:** `evalite.each` runs same test case through both variants, enabling direct comparison.

### 5. Run Evaluation & Manually Compare

Execute eval and review output table:

```bash
pnpm evalite
```

**Manual inspection process:**
1. Review output table showing both answers per test case
2. Compare answers against expected answers
3. Note correctness: which variant answered correctly?
4. Identify patterns:
   - **Agents excel**: Multi-hop queries, filtering operations, thread following
   - **RAG sufficient**: Simple fact lookups, single-document answers
   - **Edge cases**: When does each approach fail?

**Example observations:**
- Simple question "What's the mortgage amount?" - both approaches work, RAG faster
- Multi-hop "Who sent email about X and what did they say about Y?" - agent better (can chain searches)
- Filtering "Emails from Jennifer after August" - agent better (dedicated filter tool)
- Thread "What was the gazumping situation?" - agent better (includeThread parameter)

**Mindset:** Treat this as experiment, not test. Goal: learn when each approach shines.

## Notes

- No scorers yet - manual inspection sufficient for learning comparative eval methodology
- LLM-as-judge scorer deferred to next lesson (6.5)
- Focus: experimental mindset, identifying approach boundaries
- Real insight: agents add value for complex multi-step queries; RAG works for simple lookups
- Cost/latency tradeoff: agents slower/pricier but more capable
