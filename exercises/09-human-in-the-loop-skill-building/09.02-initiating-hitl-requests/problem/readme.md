Right now, your AI agent can send emails without asking for permission first. The agent just goes ahead and executes the `sendEmail` tool immediately, which means emails get sent without any human oversight.

This is a problem. You need to implement a human-in-the-loop system where the agent asks for approval before actually sending anything.

The good news? The frontend UI is already built and ready to display approval requests. You just need to wire up the backend to send those requests instead of executing the tool directly.

## Steps To Complete

### Understanding The Current Flow

- [ ] Review the `api/chat.ts` file and locate the `sendEmail` tool definition

Currently, the tool's `execute` function calls `sendEmail()` directly, which logs to the console:

```ts
execute: async ({ to, subject, content }) => {
  // This sends the email immediately - no approval!
  await sendEmail({ to, subject, content });

  return 'Requested to send an email';
},
```

- [ ] Notice how the tool doesn't communicate with the frontend at all

The [writer object](/PLACEHOLDER/ai-sdk-writer) is available in the `execute` function of [`createUIMessageStream`](/PLACEHOLDER/createUIMessageStream) but isn't being used to send data to the frontend.

### Sending Approval Requests To The Frontend

- [ ] Replace the direct `sendEmail()` call with a `data-approval-request` message part

Instead of executing the email, use the `writer` to send an approval request to the frontend:

```ts
execute: ({ to, subject, content }) => {
  // TODO: change this so that it sends a part
  // of data-approval-request to the writer instead of
  // sending the email.
  await sendEmail({ to, subject, content });

  return 'Requested to send an email';
},
```

- [ ] Write the approval request using the `writer.write()` method

The [writer.write()](/PLACEHOLDER/ai-sdk-writer-write) method accepts an object with:

- `type`: set to `'data-approval-request'`
- `data`: an object containing your `tool` data

The `tool` should be a `ToolRequiringApproval` object with:

- `id`: a unique identifier (use `crypto.randomUUID()`)
- `type`: `'send-email'`
- `to`, `subject`, `content`: the email details

### Stopping At Tool Calls

- [ ] Add a second stop condition to the [`stopWhen`](/PLACEHOLDER/ai-sdk-stop-when) array

Currently, the agent only stops when `stepCountIs(10)`. You need to also stop when the `sendEmail` tool is called:

```ts
stopWhen: [stepCountIs(10)],
```

- [ ] Import the [`hasToolCall`](/PLACEHOLDER/ai-sdk-has-tool-call) function from the AI SDK

This function is already imported in the file, but check that it's available:

```ts
import {
  // ... other imports
  hasToolCall,
  // ... other imports
} from 'ai';
```

- [ ] Add `hasToolCall('sendEmail')` to the `stopWhen` array

The agent will now stop either when it reaches 10 steps OR when it calls the `sendEmail` tool.

### Testing The Human-in-the-Loop System

- [ ] Run the development server with `pnpm run dev`

- [ ] Send the pre-filled message: "Send an email to team@aihero.dev saying what a fantastic AI workshop I'm currently attending. Thank them for the workshop."

- [ ] Observe the response

You should see the agent stop and display an approval request UI showing:

- The recipient email address
- The subject line
- The email content

The email should NOT be sent yet - only the approval request should appear.

- [ ] Check the browser console

No actual emails should be logged. The system should only be requesting approval.
