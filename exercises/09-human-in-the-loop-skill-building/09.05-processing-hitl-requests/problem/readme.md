Right now, the system allows users to approve or reject tool calls, but there's no validation preventing users from sending random messages instead. They should be forced to either approve or reject pending requests before the conversation can continue.

The message history has two states: valid (all tool requests have decisions) and invalid (some requests lack decisions). We need to validate incoming messages and link tool requests with their corresponding user decisions.

This validation happens in the `findDecisionsToProcess` function, which takes the most recent user and assistant messages and returns either a validation error or a set of decisions ready to process.

## Steps To Complete

### Understanding the Function Structure

- [ ] Review the `findDecisionsToProcess` function in `api/hitl-processor.ts`

The function already has scaffolding in place. It takes two arguments and returns either a `HITLError` or an array of `HITLDecisionsToProcess` items.

```ts
export const findDecisionsToProcess = (opts: {
  mostRecentUserMessage: MyMessage;
  mostRecentAssistantMessage: MyMessage | undefined;
}): HITLError | HITLDecisionsToProcess[] => {
  // TODO: implementation
};
```

- [ ] Understand where this function is called in `api/chat.ts`

The POST route calls `findDecisionsToProcess` and checks if it returns a `HITLError`. If it does, a Response with the error message is returned to the frontend.

```ts
const hitlResult = findDecisionsToProcess({
  mostRecentUserMessage,
  mostRecentAssistantMessage,
});

// NOTE: if hitlResult returns a HITLError,
// we should return a Response with the error message
if ('status' in hitlResult) {
  return new Response(hitlResult.message, {
    status: hitlResult.status,
  });
}
```

### Extracting Tools Requiring Approval

- [ ] Extract all tool requests from the most recent assistant message

Map over the [`parts`](/PLACEHOLDER/message-parts) of the assistant message and filter for `data-approval-request` types. Extract the `tool` data from each part.

```ts
// TODO: Get all the tools requiring approval from the assistant message
// and return them in an array.
const tools: ToolRequiringApproval[] = TODO;
```

Store these in a `tools` array that you'll use later.

### Extracting User Decisions

- [ ] Extract all decisions from the most recent user message

Map over the [`parts`](/PLACEHOLDER/message-parts) of the user message and filter for `data-approval-decision` types. Create a [`Map`](/PLACEHOLDER/javascript-map) where the key is the `toolId` and the value is the user's decision.

```ts
// TODO: Get all the decisions that the user has made
// and return them in a map.
const decisions: Map<string, ToolApprovalDecision> = TODO;
```

This map structure makes it easy to look up whether a decision exists for a specific tool.

### Validating Decisions Exist for All Tools

- [ ] Loop through each tool requiring approval

For each tool, check if a corresponding decision exists in the `decisions` map using the tool's `id`.

```ts
for (const tool of tools) {
  const decision: ToolApprovalDecision | undefined =
    decisions.get(tool.id);

  // TODO: if the decision is not found, return a HITLError -
  // the user should make a decision before continuing.
  //
  // TODO: if the decision is found, add the tool and
  // decision to the decisionsToProcess array.
}
```

- [ ] Return a `HITLError` if a decision is missing

When a tool has no corresponding decision, return a `HITLError` with a descriptive message and status code 400.

- [ ] Add valid tool-decision pairs to the results

When a decision is found, add an object containing both the tool and the decision to the `decisionsToProcess` array.

### Validating Message History Structure

- [ ] Add validation in `api/chat.ts`

Look for the TODO comment in the POST route handler. You need to validate that:

1. The messages array has at least one message
2. The most recent message is a user message

```ts
const mostRecentUserMessage = messages[messages.length - 1];

// TODO: return a Response of status 400 if there
// is no most recent user message.
```

If either condition fails, return a Response with status 400 and an appropriate error message.

### Testing the Validation

- [ ] Run the application with `pnpm run dev`

- [ ] Send an initial message to the assistant

Type "Send an email to team@aihero.dev saying what a fantastic AI workshop I'm currently attending. Thank them for the workshop." and submit.

- [ ] Attempt to send another message without approving or rejecting

Try typing a message without clicking Approve or Reject on the pending tool request.

- [ ] Verify the error is returned

The server should return a `400` status code and an error message.

- [ ] Approve or reject the tool request

Click the Approve or Reject button and verify that the server returns a `200` status code and an array of decisions to process.

- [ ] Check the server console

Run the application and look for console output showing the `hitlResult` being logged:

```ts
console.dir(hitlResult, { depth: null });
```

You should see an array of decisions to process, each containing a tool and its corresponding decision.
