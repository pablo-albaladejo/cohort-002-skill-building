So far, our email search tools have relied on semantic search and clever algorithms. This works well when we want to be vague with our prompts, but it limits what we can do.

The real power comes from giving the LLM multiple tools to choose from. Instead of just searching, we want to let it filter emails by various criteria - almost like querying an SQL database. When the agent can pick and choose between search and filter tools, it can provide much more accurate and targeted results.

Let's build this multi-tool system.

## Adding the Filter Emails Tool

<!-- VIDEO -->

Let's add a `filterEmails` tool that allows precise filtering of emails by sender, recipient, date range, and text content. This complements the semantic search tool for more exact queries.

### Steps To Complete

#### Creating the filter tool file

- [ ] Create a new file `src/app/api/chat/filter-tool.ts` with the basic tool structure

<Spoiler>

```typescript
// src/app/api/chat/filter-tool.ts
import { loadEmails } from '@/app/search';
import { tool } from 'ai';
import { z } from 'zod';

// ADDED: New tool for filtering emails by exact criteria
export const filterEmailsTool = tool({
  description:
    "Filter emails by exact criteria like sender, recipient, date range, or text content. Use this for precise filtering (e.g., 'emails from John', 'emails before 2024-01-01', 'emails containing invoice').",
  inputSchema: z.object({
    from: z
      .string()
      .describe(
        'Filter by sender email/name (partial match, case-insensitive)',
      )
      .optional(),
    to: z
      .string()
      .describe(
        'Filter by recipient email/name (partial match, case-insensitive)',
      )
      .optional(),
    contains: z
      .string()
      .describe(
        'Filter by text in subject or body (partial match, case-insensitive)',
      )
      .optional(),
    before: z
      .string()
      .describe(
        "Filter emails before this ISO 8601 timestamp (e.g., '2024-01-01T00:00:00Z')",
      )
      .optional(),
    after: z
      .string()
      .describe(
        "Filter emails after this ISO 8601 timestamp (e.g., '2024-01-01T00:00:00Z')",
      )
      .optional(),
    limit: z
      .number()
      .describe('Maximum number of results to return')
      .default(10),
  }),
  execute: async ({
    from,
    to,
    contains,
    before,
    after,
    limit,
  }) => {
    console.log('Filter params:', {
      from,
      to,
      contains,
      before,
      after,
      limit,
    });

    const emails = await loadEmails();

    let filtered = emails;

    return {
      emails: filtered.map((email) => ({
        id: email.id,
        subject: email.subject,
        body: email.body,
        from: email.from,
        to: email.to,
        timestamp: email.timestamp,
      })),
    };
  },
});
```

</Spoiler>

#### Implementing all filter logic

- [ ] Add filtering logic for `from`, `to`, `contains`, `before`, and `after` parameters, then apply the limit and return results

<Spoiler>

```typescript
// CHANGED: Add filtering logic inside the execute function
if (from) {
  const lowerFrom = from.toLowerCase();
  filtered = filtered.filter((email) =>
    email.from.toLowerCase().includes(lowerFrom),
  );
}

if (to) {
  const lowerTo = to.toLowerCase();
  filtered = filtered.filter((email) => {
    const toStr = Array.isArray(email.to)
      ? email.to.join(' ')
      : email.to;
    return toStr.toLowerCase().includes(lowerTo);
  });
}

if (contains) {
  const lowerContains = contains.toLowerCase();
  filtered = filtered.filter(
    (email) =>
      email.subject.toLowerCase().includes(lowerContains) ||
      email.body.toLowerCase().includes(lowerContains),
  );
}

if (before) {
  filtered = filtered.filter(
    (email) => email.timestamp < before,
  );
}

if (after) {
  filtered = filtered.filter((email) => email.timestamp > after);
}

// CHANGED: Apply limit and return results
const results = filtered.slice(0, limit);

console.log(
  `Filtered ${filtered.length} emails, returning ${results.length}`,
);

return {
  emails: results.map((email) => ({
    id: email.id,
    subject: email.subject,
    body: email.body,
    from: email.from,
    to: email.to,
    timestamp: email.timestamp,
  })),
};
```

</Spoiler>

#### Adding the filter tool to getTools

- [ ] In `src/app/api/chat/route.ts`, import the `filterEmailsTool`

```typescript
import { filterEmailsTool } from './filter-tool';
```

- [ ] Update the `getTools` function to include the `filterEmailsTool`

<Spoiler>

```typescript
// CHANGED: Add filterEmailsTool to the tools object
const getTools = (messages: UIMessage[]) => ({
  search: searchTool(messages),
  filterEmails: filterEmailsTool,
});
```

</Spoiler>

#### Updating the system prompt

- [ ] Replace the rules section in the system prompt to explain when to use each tool

<Spoiler>

```txt
// CHANGED: Update system prompt with tool selection logic
<rules>
- You have TWO tools available: 'search' and 'filterEmails'
- Choose the appropriate tool based on the query type:

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

- NEVER answer from your training data - always use tools first
- If the first query doesn't find enough information, try different approaches or tools
- Only after using tools should you formulate your answer based on the results
</rules>
```

</Spoiler>

- [ ] Update the text in the `<the-ask>` section to reference using appropriate tools

<Spoiler>

```typescript
// CHANGED: Update the-ask to reflect multi-tool approach
<the-ask>
Here is the user's question. Use the appropriate tool(s) first, then provide your answer based on what you find.
</the-ask>
```

</Spoiler>

#### Testing the filter tool

- [ ] Start the development server

```bash
pnpm dev
```

- [ ] Try a query that uses exact filtering, like "Give me the last five emails between Sarah and Alex"

- [ ] The model should call the `filterEmails` tool twice — once with `from: Sarah, to: Alex, limit: 5` and once with `from: Alex, to: Sarah, limit: 5`

- [ ] Verify that the console logs show the filter parameters being applied correctly

- [ ] Try other filter combinations like filtering by date ranges, text content, or sender names to ensure the model chooses the right tool

- [ ] Compare with semantic search queries (like "emails about the project") to confirm the model uses the `search` tool instead when appropriate

## Displaying the Filter Emails Tool in Frontend

<!-- VIDEO -->

We're adding a new tool display case for the `filterEmails` tool in the chat component, similar to the existing search tool display.

### Steps To Complete

#### Add the filterEmails tool case to the message parts switch

- [ ] Open `src/app/chat.tsx` and locate the switch statement that handles different message part types (around line 135)

- [ ] After the `case "tool-search":` block, add a new case for `"tool-filterEmails"`

<Spoiler>

```typescript
// src/app/chat.tsx
// ADDED: New case to display filterEmails tool results
case "tool-filterEmails":
  return (
    <Tool
      key={`${message.id}-${i}`}
      className="w-full"
      defaultOpen={false}
    >
      <ToolHeader
        title="Filter Emails"
        type={part.type}
        state={part.state}
      />
      <ToolContent>
        <div className="space-y-4 p-4">
          {/* ADDED: Display filter input parameters */}
          {part.input && (
            <div className="space-y-2">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Filters
              </h4>
              <div className="text-sm space-y-1">
                {part.input.from && (
                  <div>
                    <span className="font-medium">From:</span> {part.input.from}
                  </div>
                )}
                {part.input.to && (
                  <div>
                    <span className="font-medium">To:</span> {part.input.to}
                  </div>
                )}
                {part.input.contains && (
                  <div>
                    <span className="font-medium">Contains:</span>{" "}
                    {part.input.contains}
                  </div>
                )}
                {part.input.before && (
                  <div>
                    <span className="font-medium">Before:</span>{" "}
                    {new Date(part.input.before).toLocaleString()}
                  </div>
                )}
                {part.input.after && (
                  <div>
                    <span className="font-medium">After:</span>{" "}
                    {new Date(part.input.after).toLocaleString()}
                  </div>
                )}
                {part.input.limit && (
                  <div>
                    <span className="font-medium">Limit:</span>{" "}
                    {part.input.limit}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADDED: Display email results from filter */}
          {part.state === "output-available" && part.output && (
            <EmailResultsGrid emails={part.output.emails} />
          )}

          {/* ADDED: Display error state if filter fails */}
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

#### Update the EmailResultsGrid component

- [ ] Update the `EmailResultsGrid` component to remove the `score` property from the emails type definition

<Spoiler>

```typescript
// src/app/chat.tsx
// CHANGED: Remove score property since filterEmails doesn't return scores
const EmailResultsGrid = ({
  emails,
}: {
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    to: string | string[];
    body: string;
  }>;
}) => {
  // ... rest of component remains the same
};
```

</Spoiler>
