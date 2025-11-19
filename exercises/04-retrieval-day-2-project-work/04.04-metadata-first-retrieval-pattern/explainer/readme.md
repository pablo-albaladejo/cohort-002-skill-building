Right now our agent fetches entire emails and chunks into context immediately when searching. This works, but it's not how real-world search typically operates.

Think about Google search - you see small snippets first, then dive deeper into full results only when needed. This approach is more efficient and better mimics how users actually interact with search results.

We can apply the same pattern to our email search tool. Instead of loading complete email content upfront, we'll return preview snippets. Users can then call a separate tool to view the full email if they need it. This is the same strategy that coding agents use when examining files - they check metadata and filenames before opening the full file.

## Metadata-First Retrieval Pattern

<!-- VIDEO -->

Let's implement a metadata-first retrieval pattern where search and filter tools return only snippets, and a new `getEmails` tool fetches full content.

### Steps To Complete

#### Creating the `getEmailsTool`

- [ ] Create a new file `src/app/api/chat/get-emails-tool.ts` with a tool that fetches full email content by IDs.

<Spoiler>

```typescript
// src/app/api/chat/get-emails-tool.ts
import { loadEmails } from '@/app/search';
import { tool } from 'ai';
import { z } from 'zod';

export const getEmailsTool = tool({
  description:
    'Fetch full content of specific emails by their IDs. Use this after searching/filtering to retrieve complete email bodies.',
  inputSchema: z.object({
    ids: z
      .array(z.string())
      .describe(
        'Array of email IDs to retrieve full content for',
      ),
  }),
  execute: async ({ ids }) => {
    console.log('Get emails params:', { ids });

    const emails = await loadEmails();

    const results = emails.filter((email) =>
      ids.includes(email.id),
    );

    console.log(`Returning ${results.length} emails`);

    return {
      emails: results.map((email) => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        timestamp: email.timestamp,
        body: email.body,
        cc: email.cc,
        inReplyTo: email.inReplyTo,
        references: email.references,
      })),
    };
  },
});
```

</Spoiler>

#### Updating the `filterEmailsTool`

- [ ] Modify `src/app/api/chat/filter-tool.ts` to update the description and return snippets instead of full bodies.

<Spoiler>

```typescript
// src/app/api/chat/filter-tool.ts
description:
  "Filter emails by exact criteria like sender, recipient, date range, or text content. Returns metadata with snippets only - use getEmails tool to fetch full content of specific emails.",
```

</Spoiler>

- [ ] Update the return statement to include `threadId`, `snippet`, and remove `body`:

<Spoiler>

```typescript
return {
  emails: results.map((email) => {
    const snippet =
      email.body.slice(0, 150).trim() +
      (email.body.length > 150 ? '...' : '');

    return {
      id: email.id,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      to: email.to,
      timestamp: email.timestamp,
      snippet,
    };
  }),
};
```

</Spoiler>

#### Updating the `searchTool`

- [ ] Modify `src/app/api/chat/search-tool.ts` to update the description.

<Spoiler>

```typescript
description:
  "Search emails using both keyword and semantic search. Returns metadata with snippets only - use getEmails tool to fetch full content of specific emails.",
```

</Spoiler>

- [ ] Update the return statement to extract the full email for `threadId` and return snippets:

<Spoiler>

```typescript
// src/app/api/chat/search-tool.ts
// CHANGED: Return metadata with snippets only
const topEmails = rerankedResults.map((r) => {
  // Get full email to extract threadId
  const fullEmail = emails.find((e) => e.id === r.email.id);
  const snippet =
    r.email.chunk.slice(0, 150).trim() +
    (r.email.chunk.length > 150 ? '...' : '');

  return {
    id: r.email.id,
    threadId: fullEmail?.threadId ?? '',
    subject: r.email.subject,
    from: r.email.from,
    to: r.email.to,
    timestamp: r.email.timestamp,
    score: r.score,
    snippet,
  };
});
```

</Spoiler>

#### Adding the tool to the chat API

- [ ] Import the `getEmailsTool` in `src/app/api/chat/route.ts`.

```typescript
import { getEmailsTool } from './get-emails-tool';
```

- [ ] Add the `getEmailsTool` to the tools object in the `getTools` function.

<Spoiler>

```typescript
// src/app/api/chat/route.ts
const getTools = (messages: UIMessage[]) => ({
  search: searchTool(messages),
  filterEmails: filterEmailsTool,
  // ADDED: New tool for fetching full email content
  getEmails: getEmailsTool,
});
```

</Spoiler>

#### Updating the system prompt

- [ ] Update the system prompt in `src/app/api/chat/route.ts` to describe the three-step workflow.

<Spoiler>

```typescript
// src/app/api/chat/route.ts
system: `
<task-context>
You are an email assistant that helps users find and understand information from their emails.
</task-context>

<rules>
- You have THREE tools available: 'search', 'filterEmails', and 'getEmails'
- Follow this multi-step workflow for token efficiency:

  STEP 1 - Browse metadata:
  USE 'filterEmails' when the user wants to:
  - Find emails from/to specific people (e.g., "emails from John", "emails to sarah@example.com")
  - Filter by date ranges (e.g., "emails before January 2024", "emails after last week")
  - Find emails containing exact text (e.g., "emails containing 'invoice'")
  - Any combination of precise filtering criteria

  USE 'search' when the user wants to:
  - Find information semantically (e.g., "emails about the project deadline")
  - Search by concepts or topics (e.g., "discussions about budget")
  - Find answers to questions (e.g., "what did John say about the meeting?")
  - Any query requiring understanding of meaning/context
  - Find people by name or description (e.g., "Mike's biggest client")

  NOTE: 'search' and 'filterEmails' return metadata with snippets only (id, threadId, subject, from, to, timestamp, snippet)

  STEP 2 - Review and select:
  - Review the subjects, metadata, and snippets from search/filter results
  - Identify which specific emails need full content to answer the user's question
  - If snippets contain enough info, answer directly without fetching full content

  STEP 3 - Fetch full content:
  USE 'getEmails' to retrieve full email bodies:
  - Pass array of email IDs you need to read completely

- NEVER answer from your training data - always use tools first
- If the first query doesn't find enough information, try different approaches or tools
- Only after using tools should you formulate your answer based on the results
</rules>

<the-ask>
Here is the user's question. Follow the multi-step workflow above to efficiently find and retrieve the information.
</the-ask>
`,
```

</Spoiler>

#### Updating the chat component

- [ ] Update `src/app/chat.tsx` to add a case for `tool-getEmails`.

<Spoiler>

```typescript
// src/app/chat.tsx
case "tool-getEmails":
  return (
    <Tool
      key={`${message.id}-${i}`}
      className="w-full"
      defaultOpen={true}
    >
      <ToolHeader
        title="Get Emails"
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
              <div className="text-sm space-y-1">
                {part.input.ids && (
                  <div>
                    <span className="font-medium">
                      Email IDs:
                    </span>{" "}
                    {part.input.ids.length} email
                    {part.input.ids.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full email content */}
          {part.state === "output-available" &&
            part.output && (
              <FullEmailDisplay emails={part.output.emails} />
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

#### Updating the frontend components

- [ ] Add a new `FullEmailDisplay` component to `src/app/chat.tsx` that displays full email content.

<Spoiler>

```typescript
// src/app/chat.tsx
// ADDED: Component to display full email content
const FullEmailDisplay = ({
  emails,
}: {
  emails: Array<{
    id: string;
    threadId?: string;
    subject: string;
    from: string;
    to: string | string[];
    timestamp?: string;
    body: string;
  }>;
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Full Content ({emails.length} {emails.length === 1 ? "email" : "emails"})
      </h4>
      <div className="space-y-4">
        {emails.map((email, idx) => (
          <div
            key={idx}
            className="rounded-md border bg-muted/30 p-4 text-sm space-y-3"
          >
            <div>
              <div className="font-medium text-base">{email.subject}</div>
              {email.timestamp && (
                <div className="text-muted-foreground text-xs mt-1">
                  {new Date(email.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">
                <span className="font-medium">From:</span> {email.from}
              </div>
              <div className="text-muted-foreground text-xs">
                <span className="font-medium">To:</span>{" "}
                {Array.isArray(email.to) ? email.to.join(", ") : email.to}
              </div>
            </div>
            <div className="pt-3 border-t whitespace-pre-wrap">
              {email.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

</Spoiler>

- [ ] Update the `EmailResultsGrid` component in `src/app/chat.tsx` to display snippets instead of full bodies.

<Spoiler>

```typescript
// src/app/chat.tsx
// CHANGED: Display snippets instead of full bodies
const EmailResultsGrid = ({
  emails,
}: {
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    to: string | string[];
    snippet?: string;
    timestamp?: string;
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
            {email.snippet && (
              <div className="text-muted-foreground text-xs mt-2 pt-2 border-t">
                {email.snippet}
              </div>
            )}
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

#### Testing

- [ ] Start the development server.

```bash
pnpm dev
```

- [ ] Ask the assistant for recent emails: "Give me the most recent 10 email bodies".

The assistant should call `filterEmails` first to get metadata with snippets, then call `getEmails` with specific IDs to fetch full content.

- [ ] Ask a semantic search question: "Who is Sarah mentoring in climbing?"

The assistant should search for relevant emails, review the snippets, then selectively fetch only the emails needed to answer the question completely.

- [ ] Verify that snippets appear in the search/filter results, and full content only appears after calling `getEmails`.

## Adding Thread Support

<!-- VIDEO -->

Let's add a boolean parameter to the `getEmailsTool` to allow the LLM to fetch entire email conversation threads instead of just individual emails. This enables better context-aware responses.

### Steps To Complete

#### Update the `getEmailsTool` description and schema

- [ ] Open `src/app/api/chat/get-emails-tool.ts` and update the tool description to mention thread support.

- [ ] Add an `includeThread` boolean parameter to the input schema with a default value of `false`.

<Spoiler>

```typescript
// src/app/api/chat/get-emails-tool.ts
export const getEmailsTool = tool({
  description:
    "Fetch full content of specific emails by their IDs. Use this after searching/filtering to retrieve complete email bodies. Optionally include entire conversation threads.",
  inputSchema: z.object({
    ids: z
      .array(z.string())
      .describe("Array of email IDs to retrieve full content for"),
    // ADDED: New parameter to fetch entire threads
    includeThread: z
      .boolean()
      .describe(
        "If true, fetch entire conversation threads for the specified emails"
      )
      .default(false),
  }),
```

</Spoiler>

#### Implement thread fetching logic

- [ ] Update the `execute` function to accept the `includeThread` parameter and add logic to fetch all emails in the same thread when `includeThread` is `true`.

<Spoiler>

```typescript
// src/app/api/chat/get-emails-tool.ts
// CHANGED: Add includeThread parameter and logic
execute: async ({ ids, includeThread }) => {
  console.log("Get emails params:", { ids, includeThread });

  const emails = await loadEmails();

  let results = emails.filter((email) => ids.includes(email.id));

  if (includeThread && results.length > 0) {
    // Get all unique threadIds from the requested emails
    const threadIds = [...new Set(results.map((email) => email.threadId))];

    // Get all emails that belong to these threads
    results = emails.filter((email) => threadIds.includes(email.threadId));

    // Sort by timestamp to maintain conversation order
    results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  console.log(`Returning ${results.length} emails`);

  return {
    emails: results.map((email) => ({
      id: email.id,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      to: email.to,
      timestamp: email.timestamp,
      body: email.body,
      cc: email.cc,
      inReplyTo: email.inReplyTo,
      references: email.references,
    })),
  };
},
```

</Spoiler>

#### Update system prompt guidance

- [ ] Open `src/app/api/chat/route.ts` and locate the system prompt for the chat assistant.

- [ ] Add guidance about when to use `includeThread=true` and `includeThread=false`.

<Spoiler>

```typescript
// src/app/api/chat/route.ts
  STEP 3 - Fetch full content:
  USE 'getEmails' to retrieve full email bodies:
  - Pass array of email IDs you need to read completely
  // ADDED: Thread context guidance
  - Set includeThread=true if you need conversation context (replies, full thread)
  - Set includeThread=false for individual emails
```

</Spoiler>

#### Display thread parameter in frontend

- [ ] Open `src/app/chat.tsx` and find the `tool-getEmails` case in the message rendering logic.

- [ ] Add a display line showing whether `includeThread` is enabled.

<Spoiler>

```typescript
// src/app/chat.tsx
case "tool-getEmails":
  return (
    <Tool
      key={`${message.id}-${i}`}
      className="w-full"
      defaultOpen={true}
    >
      <ToolHeader
        title="Get Emails"
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
              <div className="text-sm space-y-1">
                {part.input.ids && (
                  <div>
                    <span className="font-medium">
                      Email IDs:
                    </span>{" "}
                    {part.input.ids.length} email
                    {part.input.ids.length !== 1 ? "s" : ""}
                  </div>
                )}
                {/* ADDED: Display includeThread parameter */}
                <div>
                  <span className="font-medium">
                    Include Thread:
                  </span>{" "}
                  {part.input.includeThread ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
```

</Spoiler>

### Testing

#### Start the development server

- [ ] Run the development server to test the changes.

```bash
pnpm dev
```

- [ ] Ask a question requiring full email context, such as "What was the full email history between Sarah and the mortgage broker?"

- [ ] Verify the assistant uses the `getEmails` tool with `includeThread: true`.

- [ ] Check that the tool output shows "Include Thread: Yes".

- [ ] Confirm that multiple emails from the same thread are returned and sorted by timestamp.
