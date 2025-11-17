Your system is working from the front-end perspective, but there's a critical problem. The custom data parts you've created (`approval-request` and `approval-decision`) are being ignored when passed to the LLM.

The LLM understands text parts, tool calls, and reasoning tokens because those are built into the provider. But it has no idea what your custom data parts mean. When you call [`convertToModelMessages()`](/PLACEHOLDER/convertToModelMessages), these custom parts simply vanish from the message history.

This creates a broken feedback loop. When the user approves or rejects a tool, the LLM never learns about it. So if you reject an email request with feedback, the model won't see that rejection and won't try a different approach.

Fortunately, the AI SDK has a built-in solution.

## Steps To Complete

### Converting Approval Requests

- [ ] Open `api/chat.ts` and locate the `annotateMessageHistory` function

  This function is where [`convertToModelMessages()`](/PLACEHOLDER/convertToModelMessages) is called:

  ```ts
  const annotateMessageHistory = (
    messages: MyMessage[],
  ): ModelMessage[] => {
    // TODO: Use convertDataPart in the second parameter of convertToModelMessages
    // to allow the model to read the custom data parts.
    // Without this, the model will only see the text parts/tool calls.
    const modelMessages =
      convertToModelMessages<MyMessage>(messages);

    return modelMessages;
  };
  ```

- [ ] Add a second parameter to [`convertToModelMessages()`](/PLACEHOLDER/convertToModelMessages)

  You'll pass an object with a `convertDataPart` function:

  ```ts
  convertToModelMessages<MyMessage>(messages, {
    convertDataPart(part) {
      // Handle custom data parts here
    },
  });
  ```

- [ ] Handle the `data-approval-request` part type

  When the part type is `'data-approval-request'`, convert it to a text message that describes what happened:

  ```ts
  if (part.type === 'data-approval-request') {
    return {
      type: 'text',
      text: 'TODO: write some text here!',
    };
  }
  ```

  This tells the LLM exactly what tool call was requested, with all the details it needs.

### Converting Approval Decisions

- [ ] Handle the `data-approval-decision` part type

  Create separate text messages depending on whether the decision was approved or rejected:
  - For approvals, use a simple confirmation:

  ```ts
  if (part.type === 'data-approval-decision') {
    if (part.data.decision.type === 'approve') {
      return {
        type: 'text',
        text: 'TODO: Write some text here!',
      };
    }
  ```

  - For rejections, include the user's feedback reason:

  ```ts
    return {
      type: 'text',
      text: 'TODO: Write some text here!',
    };
  }
  ```

  This gives the LLM critical context: it tried something, the user said no, and here's why.

### Testing The Solution

- [ ] Run the application with `pnpm run dev`

- [ ] Send the pre-filled message to request an email

  The assistant should request to send an email and show you the approval buttons.

- [ ] Try the approve flow first

  Click "Approve" and verify the email request goes through. The model should understand the approval and continue the conversation.

- [ ] Try the reject flow

  Send another message to trigger a new email request. This time, click "Reject" and provide feedback explaining why (for example: "The tone is too formal").

  The assistant should now see your rejection with your reasoning in the message history. It should understand what went wrong and try a different approach with a new email request.

- [ ] Check the browser console or server logs

  Verify that the message history is being properly converted. You should see the custom data parts being transformed into readable text messages.
