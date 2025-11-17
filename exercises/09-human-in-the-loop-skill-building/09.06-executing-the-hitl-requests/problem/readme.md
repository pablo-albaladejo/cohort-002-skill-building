We've built the scaffolding to request human approval for tool calls, but now we need to actually execute those approved tools and communicate the results back to the LLM.

The tricky part is that the LLM needs to know what happened when we called the tool. We can't just silently execute the tool and move on - we need to add the tool's output to our message history so the LLM can see the result and continue the conversation intelligently.

## Steps To Complete

### Adding Approval Result Conversion

- [ ] Open the `annotateMessageHistory` function in `api/chat.ts`

  This function converts our custom message data parts into text that the LLM can understand. We need to add a case for when a tool has been executed.

- [ ] Add a conversion case for the `data-approval-result` part type

  When the `part.type` is `'data-approval-result'`, convert it to a text message that describes what happened when the tool was called.

```ts
const annotateMessageHistory = (
  messages: MyMessage[],
): ModelMessage[] => {
  const modelMessages = convertToModelMessages<MyMessage>(
    messages,
    {
      convertDataPart(part) {
        if (part.type === 'data-approval-request') {
          return {
            type: 'text',
            text: `The assistant requested to send an email: To: ${part.data.tool.to}, Subject: ${part.data.tool.subject}, Content: ${part.data.tool.content}`,
          };
        }
        if (part.type === 'data-approval-decision') {
          if (part.data.decision.type === 'approve') {
            return {
              type: 'text',
              text: 'The user approved the tool.',
            };
          }
          return {
            type: 'text',
            text: `The user rejected the tool: ${part.data.decision.reason}`,
          };
        }

        // TODO: add a case for data-approval-result for after the tool
        // has been executed.
        return part;
      },
    },
  );

  return modelMessages;
};
```

Use `part.data.output.message` to include the tool's result in the text response.

### Executing Approved Tools

- [ ] Locate the approval processing loop inside `createUIMessageStream` in `api/chat.ts`

  This is where we iterate through all the decisions the user made. Right now it only has scaffolding.

- [ ] When the decision type is `'approve'`, execute the tool

  Call the `sendEmail` function with the tool's email details. You can find `sendEmail` already imported at the top of the file.

```ts
for (const { tool, decision } of hitlResult) {
  if (decision.type === 'approve') {
    // TODO: the user has approved the tool, so
    // we should send the email!
    //
    // TODO: we should also add a data-approval-result
    // part to the messages array, and write it to
    // the frontend.
  }
}
```

### Writing Tool Results To The Stream

- [ ] After executing the tool, create a `data-approval-result` message part

  This part should include the tool's `id`, the `output` from executing the tool, and reference the original `toolId`.

- [ ] Use the `writer.write()` method to send this result to the frontend

  The writer is already available in the `execute` function parameter. This sends the result as it happens, so users see feedback immediately.

```ts
for (const { tool, decision } of hitlResult) {
  if (decision.type === 'approve') {
    // Call sendEmail here...

    const messagePart = {
      type: 'data-approval-result' as const,
      data: {
        toolId: tool.id,
        output: {
          type: tool.type,
          message: 'Email sent!',
        },
      },
    };

    // TODO: Write the result of the tool to the stream
    // with writer.write

    // TODO: Add the message part to the messages array
    // with messagesAfterHitl[...].parts.push(messagePart);
  }
}
```

### Adding Results To Message History

- [ ] Add the `data-approval-result` message part to the `messagesAfterHitl` array

  Notice there's already a variable called `messagesAfterHitl` at the top of the approval processing loop. This is a copy of the messages array we can safely modify.

- [ ] Push the result part to the last message's parts array

  The last message in the array is where we should add the result.

```ts
messagesAfterHitl[messagesAfterHitl.length - 1]!.parts.push(
  messagePart,
);
```

### Testing The Complete Flow

- [ ] Run the application with `pnpm run dev`

  The dev server will start at `localhost:3000`.

- [ ] Send the initial message and approve the email

  The LLM will request to send an email. Click the "Approve" button to execute it.

- [ ] Check the server console for confirmation

  Look for a console log showing the email was sent. The `sendEmail` function logs to the console when it succeeds.

- [ ] Verify the LLM continues the conversation

  After the tool executes, the LLM should respond, acknowledging that the email was sent. It should have received the approval result in the message history.

- [ ] Test rejection flow

  Send another message to generate a new email request. Click "Reject" and provide feedback on what should be improved. The LLM should generate a new version of the email based on your feedback.
