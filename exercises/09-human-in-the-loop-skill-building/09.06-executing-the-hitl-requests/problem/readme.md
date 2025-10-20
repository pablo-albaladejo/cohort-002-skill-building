We've now got every part of our loop built. We are figuring out exactly which decisions we need to execute.

So, it's finally time to hook our LLM up to the `sendEmail` call that we started with at the very start of this exercise.

## The `createUIMessageStream` Function

We're going to be spending most of this exercise inside the `createUIMessageStream` function. The scaffolding code provided includes an iteration over each member of the `hitlResult`, which is an array of HITL decisions to process.

### The `approve` Branch

Inside the loop, there's an if statement checking `decision.type === 'approve'`. If we're inside this statement, then the user has approved the action and we should finally send the email:

```ts
for (const { action, decision } of hitlResult) {
  if (decision.type === 'approve') {
    // TODO: the user has approved the action, so
    // we should send the email!
    //
    // TODO: we should also add a data-action-end
    // part to the messages array, and write it to
    // the frontend.
  }
}
```

Once the message is sent, we need to add the `data-action-end` part and do two things with it:

1. Use `writer.write` to actually write it to the front end, so the frontend stays in sync with the backend state
2. Add it to an array of `messagesAfterHitl` that we'll need to create, in the code below:

```ts
// TODO: when we process the decisions, we'll
// be modifying the messages to include the
// data-action-end parts.
// This means that we'll need to make a copy of
// the messages array, and update it.
const messagesAfterHitl = TODO;
```

We need this `messagesAfterHitl` array because after processing the decisions, we'll call the LLM again using the `getDiary` function.

```ts
// TODO: instead of referring to the 'messages' (the ones
// we got from the frontend), we'll need to reference
// the 'messagesAfterHitl' array.
// If we don't do this, our LLM won't see the outputs
// of the actions that we've performed.
prompt: getDiary(messages),
```

If we don't update our messages array, the LLM won't see the output of the actions we've performed.

To give you a hand with creating the `data-action-end` message parts, I've given you a `MyMessagePart` type that will be useful for creating these message parts:

```ts
type MyMessagePart = MyMessage['parts'][number];
```

This represents an individual part of a message - `data-action-start`, `data-action-decision`, or `data-action-end` - as well as the native parts like `text` and `reasoning`.

### The `reject` Branch

For the reject branch, we'll do something similar - we won't send the email, but we still need to update the message history with the user's feedback.

This will be noted in the `getDiary` function, which records that the user rejected the action and their reason:

```ts
// inside the getDiary function
if (part.type === 'data-action-end') {
  if (part.data.output.type === 'send-email') {
    return `The user rejected the action: ${part.data.output.reason}`;
  }
}
```

### Fixing The Diary

Finally, we need to update the `streamText` call to use our updated message history:

```ts
// TODO: instead of referring to the 'messages' (the ones
// we got from the frontend), we'll need to reference
// the 'messagesAfterHitl' array.
prompt: getDiary(messages),
```

Once we've completed these changes, we should be able to test the entire flow: asking the assistant to create an email, approving or rejecting it, and seeing the results either in the console logs (for sent emails) or in the continued conversation.

Good luck, and I'll see you in the solution!

## Steps To Complete

- [ ] Make `messagesAfterHitl` a copy of the `messages` we get from the frontend.

- [ ] In the `approve` branch of the check for `decision.type === 'approve'`:
  - [ ] Call `sendEmail()` with the action's `to`, `subject`, and `content`
  - [ ] Create a message part with type `data-action-end` showing the action succeeded. Use the `MyMessagePart` type to type it.
  - [ ] Use `writer.write()` to update the frontend
  - [ ] Add the message part to the most recent message in `messagesAfterHitl`

- [ ] In the rejection branch:
  - [ ] Create a message part with type `data-action-end` showing the action was rejected. Use the `MyMessagePart` type to type it.
  - [ ] Use `writer.write()` to update the frontend
  - [ ] Add the message part to the most recent message in `messagesAfterHitl`

- [ ] Change `prompt: getDiary(messages)` to reference the `messagesAfterHitl` array

- [ ] Test by:
  - [ ] Running the local dev server
  - [ ] Asking the assistant to send an email
  - [ ] Approving or rejecting the email
  - [ ] Checking console logs to see if the email was sent (if approved)
  - [ ] Continuing the conversation to see if the LLM acknowledges what happened
