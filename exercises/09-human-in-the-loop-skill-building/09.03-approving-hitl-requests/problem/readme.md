In this exercise, we're going to focus on the approval flow for our human-in-the-loop setup. We'll spend most of our time in the front end, with the exception of the first TODO.

## The `approval-decision` Part

We need to declare an action decision part in our `MyMessage` type. This contains the decision made by the user:

```ts
export type MyMessage = UIMessage<
  unknown,
  {
    'approval-request': {
      tool: ToolRequiringApproval;
    };
    // TODO: declare an approval-decision part that
    // contains the decision made by the user. Use
    // the ToolApprovalDecision type for the decision.
    // You'll also need an toolId field, which
    // references the action that the decision is for.
    'approval-decision': TODO;
  }
>;
```

We will definitely need an `toolId` field in this decision so that we know which action we are making a decision about - which will refer to the ID in the `action` object.

### An `ToolApprovalDecision` Type

There's a type called `ToolApprovalDecision` provided, which is in the form of a discriminated union. In one branch of the union, we have a type of `approve`, and in the other branch, we have a type of `reject` with the reason for the rejection.

```ts
export type ToolApprovalDecision =
  | {
      type: 'approve';
    }
  | {
      type: 'reject';
      reason: string;
    };
```

This is the most type-safe way of expressing this: we should only have a `reason` if we're rejecting the tool.

## The Frontend

Now, with that done, we have quite a complicated flow to work out on the front end.

### Rendering The Buttons

Our first port of call is going to be inside the `Message` function. We need to add some approve or reject buttons, and those buttons will need to call some sort of callback so that it can report up to the parent component.

I've scaffolded that callback as `onToolDecision` in the `Message` component. It's a function that will be called when the user clicks the approve or reject button.

```tsx
export const Message = (props: {
  // TODO: pass down a function that will be called
  // when the user clicks the approve or reject button.
  onToolDecision: TODO;
}) => {
  // Component implementation...
};
```

We'll then need to pass that into some buttons, which we only render if a `hasDecisionBeenMade` check is false.

```tsx
// from the Message component
{
  hasDecisionBeenMade ? null : (
    <>
      {/* TODO: render the buttons below if the
        action ID has not had a decision made.
        Use the onToolDecision prop to handle
        the button clicks. */}
    </>
  );
}
```

### The `hasDecisionBeenMade` Check

The ideal setup here is that we press the button and the buttons disappear.

In order to get that working, we can look at the `hasDecisionBeenMade` variable where we need to check if the action ID has had a decision made. If a decision has been made, we don't want to show the buttons.

```tsx
// TODO: check if the action ID has had a decision
// made. If it has, don't show the buttons below.
const hasDecisionBeenMade = TODO;
```

To figure this out, you'll need to look at the `toolIdsWithDecisionsMade` set that's passed down into the `Message` component.

```tsx
// from the Message component
export const Message = (props: {
  // TODO: pass down a set of action IDs that have
  // had decisions made. Calculate these in the
  // component above.
  toolIdsWithDecisionsMade: TODO;
}) => {
  // Component implementation...
};
```

The `Message` component only receives the parts for _the message it's rendering_. So it won't have access to the `ids` of previous completed messages.

### Calculating Decisions Made In The Parent

Once you've typed that correctly, and you've got the `hasDecisionBeenMade` check working, we need to calculate the `toolIdsWithDecisionsMade` set in the parent component.

I've given you a bit of scaffolding, including grabbing all of the message parts. But you'll need to find all the decisions, and return their `toolId`'s in an array.

```tsx
const toolIdsWithDecisionsMade = useMemo(() => {
  const allMessageParts = messages.flatMap(
    (message) => message.parts,
  );

  // TODO: calculate the set of action IDs where we have
  // made a decision.
  const decisionsByActionId = TODO;

  return decisionsByActionId;
}, [messages]);
```

### Handling Approvals and Rejections

Next, we need to implement the `onToolDecision` function. We're going to have two cases here.

- If the user has approved the action, we need to send a `data-approval-decision` part with the action ID and the decision.
- If the user has rejected the action, we need to save the action in the state so that we can show the feedback input.

```tsx
<Message
  onToolDecision={(action, decision) => {
    // TODO: if the user has approved the action,
    // use sendMessage to send a data-approval-decision
    // part with the action ID and the decision.
    //
    // TODO: if the user has rejected the action,
    // save the action in the state so that we can
    // show the feedback input.
  }}
/>
```

I've scaffolded the `toolGivingFeedbackOn` state variable below:

```tsx
// From the App component
const [toolGivingFeedbackOn, setToolGivingFeedbackOn] =
  useState<ToolRequiringApproval | null>(null);
```

I've decided that a good idea here is to reuse the `ChatInput` component for providing feedback. The user will press 'reject', and we'll change the placeholder text to ask the user for feedback.

So we'll pass down an `isGivingFeedback` prop to the `ChatInput` component.

```tsx
<ChatInput
  isGivingFeedback={!!toolGivingFeedbackOn}
  // ...other props
/>
```

### Handling The Chat Input Submission

Our `ChatInput` is now doing double duty:

- If we're giving feedback on an action, we need to send a `data-approval-decision` part with the action ID and the reason for the action
- If not, we need to send a normal text message

This means we need to update the `onSubmit` handler being passed down to the `ChatInput` component.

```tsx
onSubmit={(e) => {
  e.preventDefault();

  // TODO: if the user is giving feedback on an action,
  // send a data-approval-decision part with the action ID
  // and the reason for the rejection.

  // This code is only for when we're not giving feedback
  sendMessage({
    text: input,
  });
  setInput('');
}}
```

### Testing

Once that's complete, you should be ready for testing!

Try sending a message that will trigger an tool. You should see the buttons appear.

Clicking the approve button should send a `data-approval-decision` part with the action ID and the decision.

Clicking the reject button should save the action in the state so that we can show the feedback input. Once you submit the `ChatInput`, you should see the feedback input appear.

Try looking at the payload being sent to `/api/chat` in the network tab to see the decision being sent.

Good luck, and I'll see you in the solution!

## Steps To Complete

- [ ] Declare the `approval-decision` data type in the `MyMessage` type with the correct fields (in [`api/chat.ts`](./api/chat.ts))
  - Add an `toolId` field, which references the action that the decision is for
  - Include the `decision` field of type `ToolApprovalDecision`

- [ ] Define the `onToolDecision` function parameter type in the `Message` component
  - It should accept an `action` parameter of type `Action` and a `decision` parameter of type `ToolApprovalDecision`

- [ ] Define the `toolIdsWithDecisionsMade` prop type in the `Message` component
  - It should be a `Set<string>` containing action IDs that have had decisions made

- [ ] Implement the `toolIdsWithDecisionsMade` calculation in the `useMemo` hook in the `App` component
  - Filter all message parts to find ones with type `'data-approval-decision'`
  - Extract the `toolId` from each decision part
  - Create a `Set` with these IDs

- [ ] Implement the `hasDecisionBeenMade` check in the `Message` component
  - Check if the current action ID is in the `toolIdsWithDecisionsMade` set

- [ ] Add the approve and reject buttons with `onToolDecision` handlers
  - Only show buttons if `hasDecisionBeenMade` is false
  - Call `onToolDecision` with the action and appropriate decision

- [ ] Implement the `onToolDecision` function in the `App` component to handle both approve and reject cases
  - For approval: send a message with a `data-approval-decision` part
  - For rejection: save the action in state and clear the input

- [ ] Modify the `onSubmit` handler in the `App` component to handle feedback submission for rejected actions
  - Check if there's an action we're giving feedback on
  - If so, send a message with a `data-approval-decision` part containing the rejection reason
  - If not, send a normal text message

- [ ] Test your implementation by running the local dev server and trying to send an email. You should see the buttons appear.

- [ ] Verify that the approval and rejection flows work correctly, including the feedback submission.
