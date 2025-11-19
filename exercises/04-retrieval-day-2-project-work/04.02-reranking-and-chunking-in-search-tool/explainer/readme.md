We're going to focus on three improvements to make your agent smarter and more debuggable.

First, you'll add a reranker to improve how your agent selects tools. Then you'll give that reranker much more context by passing the entire conversation history instead of just the current message. Finally, you'll add observability to your frontend by displaying all tool calls so you can see exactly what your agent is doing.

These changes will make your agent more thoughtful about its decisions and easier to debug when things go wrong.

## Adding the Reranker

<!-- VIDEO -->

We're going to add a reranker to filter search results using
an LLM before returning them to the user.

### Steps To Complete

#### Create the `rerank.ts` file with types and function signature

- [ ] Create a new file called `rerank.ts` in the `src/app` directory with the type definition and function signature.

<Spoiler>

```typescript
// src/app/rerank.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

type ResultWithEmail = {
  email: {
    id: string;
    subject: string;
    chunk: string;
  };
  score: number;
};

export const rerankEmails = async (
  results: ResultWithEmail[],
  query: string,
): Promise<ResultWithEmail[]> => {
  // Implementation coming next
};
```

</Spoiler>

#### Implement the reranker logic

- [ ] Implement the reranker function to map results with IDs, call the LLM, and return filtered results. This should feel familiar from the skill building exercise.

<Spoiler>

```typescript
// src/app/rerank.ts
export const rerankEmails = async (
  results: ResultWithEmail[],
  query: string,
): Promise<ResultWithEmail[]> => {
  const resultsWithId = results.map((result, index) => ({
    ...result,
    id: index,
  }));

  const resultsAsMap = new Map(
    resultsWithId.map((result) => [result.id, result]),
  );

  // ADDED: Call reranker LLM
  const rerankedResults = await generateObject({
    model: google('gemini-2.5-flash-lite'),
    system: `You are a search result reranker. Your job is to analyze a list of email chunks and return only the IDs of the most relevant chunks for answering the user's question.

Given a list of chunks with their IDs and content, you should:
1. Evaluate how relevant each chunk is to the user's search query
2. Return only the IDs of the most relevant chunks

You should be selective and only include chunks that are genuinely helpful for answering the question. If a chunk is only tangentially related or not relevant, exclude its ID.

Return the IDs as a simple array of numbers.`,
    schema: z.object({
      resultIds: z
        .array(z.number())
        .describe('Array of IDs for the most relevant chunks'),
    }),
    prompt: `
      Search query:
      ${query}

      Available chunks:
      ${resultsWithId
        .map((resultWithId) =>
          [
            `## ID: ${resultWithId.id}`,
            `Subject: ${resultWithId.email.subject}`,
            `<content>`,
            resultWithId.email.chunk,
            `</content>`,
          ].join('\n\n'),
        )
        .join('\n\n')}

      Return only the IDs of the most relevant chunks for the user's search query.
    `,
  });

  console.log(
    'Reranked results:',
    rerankedResults.object.resultIds,
  );

  return rerankedResults.object.resultIds
    .map((id) => resultsAsMap.get(id))
    .filter((r) => r !== undefined);
};
```

</Spoiler>

#### Update the search tool to use the reranker

- [ ] Import the `rerankEmails` function in `search-tool.ts`:

```typescript
import { rerankEmails } from '@/app/rerank';
```

- [ ] Add a constant for the number of results to pass to the reranker:

```typescript
const NUMBER_PASSED_TO_RERANKER = 30;
```

- [ ] Update the RRF call to use this constant instead of hardcoded `30`:

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
const rrfResults = reciprocalRankFusion([
  // CHANGED: Only take the top NUMBER_PASSED_TO_RERANKER results
  bm25Results.slice(0, NUMBER_PASSED_TO_RERANKER),
  embeddingResults.slice(0, NUMBER_PASSED_TO_RERANKER),
]);
```

</Spoiler>

- [ ] Replace the old filtering logic with a call to the reranker:

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
// CHANGED: Rerank results using LLM
const query = [keywords?.join(' '), searchQuery]
  .filter(Boolean)
  .join(' ');
const rerankedResults = await rerankEmails(
  rrfResults.slice(0, NUMBER_PASSED_TO_RERANKER),
  query,
);

// Return full email objects
const topEmails = rerankedResults.map((r) => ({
  id: r.email.id,
  subject: r.email.subject,
  body: r.email.chunk,
  score: r.score,
}));

console.log('Top emails:', topEmails.length);
```

</Spoiler>

#### Test the reranker

- [ ] Run your chat application and test it with a query like "where is Sarah getting married?"

```bash
pnpm dev
```

- [ ] You should see the reranker filtering results and returning only the most relevant chunks!

## Passing Conversation History to the Reranker

<!-- VIDEO -->

We're going to enhance the reranker by passing it the full conversation history. This gives it much more context when deciding which email chunks are most relevant.

### Steps To Complete

#### Update the search tool to be a function

- [ ] In `src/app/api/chat/search-tool.ts`, convert `searchTool` from a static declaration into a function that accepts `messages: UIMessage[]` and returns the tool.

Import the necessary types:

```typescript
import { convertToModelMessages, tool, UIMessage } from 'ai';
```

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
// CHANGED: Convert searchTool to a function that accepts messages
export const searchTool = (messages: UIMessage[]) =>
  tool({
    description:
      'Search emails using both keyword and semantic search. Returns most relevant emails ranked by reciprocal rank fusion.',
    inputSchema: z.object({
      keywords: z
        .array(z.string())
        .describe(
          'Exact keywords for BM25 search (names, amounts, specific terms)',
        )
        .optional(),
      searchQuery: z
        .string()
        .describe(
          'Natural language query for semantic search (broader concepts)',
        )
        .optional(),
    }),
    execute: async ({ keywords, searchQuery }) => {
      // ... rest of implementation
    },
  });
```

</Spoiler>

#### Pass conversation history to the reranker

- [ ] Inside the `execute` function, after getting the RRF results, extract the conversation history by converting UI messages to model messages and filtering for user and assistant roles only.

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
// ADDED: Get conversation history without the tool calls
const conversationHistory = convertToModelMessages(
  messages,
).filter((m) => m.role === 'user' || m.role === 'assistant');
```

</Spoiler>

- [ ] Pass `conversationHistory` to the `rerankEmails` function:

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
const rerankedResults = await rerankEmails(
  rrfResults.slice(0, NUMBER_PASSED_TO_RERANKER),
  query,
  conversationHistory, // ADDED: Pass conversation history
);
```

</Spoiler>

#### Update the `rerankEmails` function signature

- [ ] In `src/app/rerank.ts`, update the function to accept `conversationHistory` as a parameter.

Import `ModelMessage`:

```typescript
import { generateObject, ModelMessage } from 'ai';
```

<Spoiler>

```typescript
// src/app/rerank.ts
// CHANGED: Add conversationHistory parameter
export const rerankEmails = async (
  results: ResultWithEmail[],
  query: string,
  conversationHistory: ModelMessage[],
): Promise<ResultWithEmail[]> => {
```

</Spoiler>

#### Use conversation history in the reranker prompt

- [ ] Change the `rerankEmails` function from using a `prompt` field to using `messages` array that includes the conversation history.

<Spoiler>

```typescript
// src/app/rerank.ts
// CHANGED: Use messages array instead of prompt field
const rerankedResults = await generateObject({
  model: google('gemini-2.5-flash-lite'),
  system: `You are a search result reranker. Your job is to analyze a list of email chunks and return only the IDs of the most relevant chunks for answering the user's question.

Consider the context of the conversation and the user's specific needs. Look for chunks that directly address their question or provide relevant information.

You should be selective and only include chunks that are genuinely helpful for answering the question.

Return the IDs as a simple array of numbers.`,
  schema: z.object({
    resultIds: z
      .array(z.number())
      .describe('Array of IDs for the most relevant chunks'),
  }),
  messages: [
    ...conversationHistory,
    {
      role: 'user',
      content: `
        Search query:
        ${query}

        Available chunks:
        ${resultsWithId
          .map((resultWithId) =>
            [
              `## ID: ${resultWithId.id}`,
              `Subject: ${resultWithId.email.subject}`,
              `<content>`,
              resultWithId.email.chunk,
              `</content>`,
            ].join('\n\n'),
          )
          .join('\n\n')}

        Return only the IDs of the most relevant chunks for the user's search query.
      `,
    },
  ],
});
```

</Spoiler>

#### Pass messages to searchTool in the route

- [ ] In `src/app/api/chat/route.ts`, update the tools object to call `searchTool` as a function, passing in the `messages` array

<Spoiler>

```typescript
// src/app/api/chat/route.ts
// CHANGED: Call searchTool as a function with messages
tools: {
  search: searchTool(messages),
},
```

</Spoiler>

## Displaying Tool Calls in the Frontend

<!-- VIDEO -->

Let's display the search tool calls in the frontend with email results and search parameters.

### Steps To Complete

#### Refactor tools to a function

- [ ] In `src/app/api/chat/route.ts`, import `InferUITools` from `"ai"`:

```typescript
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  InferUITools,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  UIMessage,
} from 'ai';
```

- [ ] Update the `MyMessage` type to include tool types using `InferUITools`

<Spoiler>

```typescript
// src/app/api/chat/route.ts
// CHANGED: Add tool type inference
export type MyMessage = UIMessage<
  never,
  {
    'frontend-action': 'refresh-sidebar';
  },
  InferUITools<ReturnType<typeof getTools>>
>;
```

</Spoiler>

- [ ] Create a `getTools` function that accepts messages and returns the tools object

<Spoiler>

```typescript
// src/app/api/chat/route.ts
// ADDED: Create getTools function
const getTools = (messages: UIMessage[]) => ({
  search: searchTool(messages),
});
```

</Spoiler>

- [ ] Update the `streamText` call to use `getTools(messages)` instead of defining tools inline

<Spoiler>

```typescript
// src/app/api/chat/route.ts
// CHANGED: Use getTools function
const result = await streamText({
  model: google('gemini-2.0-flash-exp'),
  system: `...`,
  messages: convertToModelMessages(messages),
  tools: getTools(messages),
  stopWhen: [stepCountIs(10)],
});
```

</Spoiler>

#### Add email metadata to search results

- [ ] In `src/app/api/chat/search-tool.ts`, update the returned email objects to include `from` and `to` fields

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
// CHANGED: Add from and to fields to email objects
const topEmails = rerankedResults.map((r) => ({
  id: r.email.id,
  subject: r.email.subject,
  body: r.email.chunk,
  from: r.email.from,
  to: r.email.to,
  score: r.score,
}));
```

</Spoiler>

#### Import Tool components

- [ ] In `src/app/chat.tsx`, import the Tool components from `@/components/ai-elements/tool`:

```typescript
import {
  Tool,
  ToolContent,
  ToolHeader,
} from '@/components/ai-elements/tool';
```

- [ ] Also import the `Button` component:

```typescript
import { Button } from '@/components/ui/button';
```

#### Display tool calls in the message parts

- [ ] In the `message.parts.map` in `src/app/chat.tsx`, add a new case for `"tool-search"`:

<Spoiler>

```tsx
// src/app/chat.tsx
// ADDED: Display tool-search case
case "tool-search":
  return (
    <Tool
      key={`${message.id}-${i}`}
      className="w-full"
      defaultOpen={false}
    >
      <ToolHeader
        title="Search"
        type={part.type}
        state={part.state}
      />
      <ToolContent>
        <div className="space-y-4 p-4">
          {/* Input parameters */}
          {part.input && (
            <div className="space-y-2">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Parameters
              </h4>
              <div className="text-sm">
                {part.input.keywords && (
                  <div>
                    <span className="font-medium">Keywords:</span>{" "}
                    {part.input.keywords.join(", ")}
                  </div>
                )}
                {part.input.searchQuery && (
                  <div>
                    <span className="font-medium">Search Query:</span>{" "}
                    {part.input.searchQuery}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email results */}
          {part.state === "output-available" && part.output && (
            <EmailResultsGrid emails={part.output.emails} />
          )}

          {/* Error state */}
          {part.state === "output-error" && (
            <div className="space-y-2">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Error
              </h4>
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {part.errorText}
              </div>
            </div>
          )}
        </div>
      </ToolContent>
    </Tool>
  );
```

</Spoiler>

#### Create EmailResultsGrid component

- [ ] At the bottom of `src/app/chat.tsx`, add the `EmailResultsGrid` component:

<Spoiler>

```typescript
// src/app/chat.tsx
// ADDED: EmailResultsGrid component
const EmailResultsGrid = ({
  emails,
}: {
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    to: string | string[];
    body: string;
    score: number;
  }>;
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedEmails = showAll ? emails : emails.slice(0, 8);
  const hasMore = emails.length > 8;

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Results ({emails.length} {emails.length === 1 ? "email" : "emails"})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedEmails.map((email, idx) => (
          <div
            key={idx}
            className="rounded-md border bg-muted/30 p-3 text-sm space-y-1"
          >
            <div className="font-medium">{email.subject}</div>
            <div className="text-muted-foreground text-xs">
              <span className="font-medium">From:</span> {email.from}
            </div>
            <div className="text-muted-foreground text-xs">
              <span className="font-medium">To:</span>{" "}
              {Array.isArray(email.to) ? email.to.join(", ") : email.to}
            </div>
          </div>
        ))}
      </div>
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full"
        >
          Show more ({emails.length - 8} more)
        </Button>
      )}
    </div>
  );
};
```

</Spoiler>

#### Update rerank types

- [ ] In `src/app/rerank.ts`, update the `ResultWithEmail` type to use `EmailChunk`:

<Spoiler>

```typescript
// src/app/rerank.ts
// CHANGED: Use EmailChunk type
import { EmailChunk } from './search';

type ResultWithEmail = {
  email: EmailChunk;
  score: number;
};
```

</Spoiler>
