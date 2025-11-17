We've got human-in-the-loop requests showing up in the chat, but there's a problem - users can't actually approve or deny them. We need to implement the frontend logic to handle approval decisions and collect feedback when requests are rejected.

This is a frontend-heavy feature, so we're focusing on understanding how the approval flow works rather than building it from scratch. The key pieces are the type system for decisions, the message component logic, and how we track which requests have been decided on.

## Steps To Complete

### Understanding The Approval Decision Type

- [ ] Review the `ToolApprovalDecision` type defined in `api/chat.ts`

This type represents a decision made by the user about a tool request. It can be either an approval or a rejection with a reason:

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

- [ ] Examine the `MyMessage` type and note the `'approval-decision'` message part

The message part structure stores the original `toolId` that the decision applies to, along with the `decision` object itself.

### Understanding The Approval Flow In The Message Component

- [ ] Look at the `Message` component in `components.tsx` and find the `onToolDecision` callback

This callback receives the tool requiring approval and whether the user clicked "approve" or "reject":

```ts
onToolDecision: (
  tool: ToolRequiringApproval,
  decision: 'approve' | 'reject',
) => void;
```

- [ ] Trace through the logic in `root.tsx` where `onToolDecision` is implemented

When the user approves, the decision is sent immediately using [`sendMessage()`](/PLACEHOLDER/send-message). When they reject, the UI changes to request feedback.

- [ ] Understand how `setToolGivingFeedbackOn` state works

This state tracks which tool is currently receiving feedback. It's used to change the placeholder text in the chat input and modify the message submission behavior.

### Tracking Decisions Made

- [ ] Find the `toolIdsWithDecisionsMade` calculation in `root.tsx`

This is a [`useMemo`](/PLACEHOLDER/use-memo) hook that collects all `toolId` values from `data-approval-decision` message parts in the message history:

```ts
const toolIdsWithDecisionsMade = useMemo(() => {
  const allMessageParts = messages.flatMap(
    (message) => message.parts,
  );

  const decisionsByToolId = new Set(
    allMessageParts
      .filter((part) => part.type === 'data-approval-decision')
      .map((part) => part.data.toolId),
  );

  return decisionsByToolId;
}, [messages]);
```

- [ ] Review how this `Set` is passed down to the `Message` component as the `toolIdsWithDecisionsMade` prop

- [ ] Find where the buttons are conditionally rendered in the `Message` component

In the `data-approval-request` part rendering, the approve/reject buttons only show if no decision has been made yet:

```ts
{hasDecisionBeenMade ? null : (
  <div className="flex gap-2">
    <button
      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      onClick={() => {
        onToolDecision(
          part.data.tool,
          'approve',
        );
      }}
    >
      Approve
    </button>
    <button
      className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
      onClick={() => {
        onToolDecision(
          part.data.tool,
          'reject',
        );
      }}
    >
      Reject
    </button>
  </div>
)}
```

### Sending Approval Decisions

- [ ] In `root.tsx`, examine what happens when the user clicks "Approve"

When approved, a `data-approval-decision` message part is sent immediately with the approval:

```ts
if (decision === 'approve') {
  sendMessage({
    parts: [
      {
        type: 'data-approval-decision',
        data: {
          toolId: tool.id,
          decision: {
            type: 'approve',
          },
        },
      },
    ],
  });
}
```

- [ ] Examine what happens when the user clicks "Reject"

When rejected, the UI enters feedback mode instead of sending the decision immediately. The input placeholder changes and `toolGivingFeedbackOn` is set.

### Sending Rejection Feedback

- [ ] Find the form submission logic in `root.tsx` that handles the `ChatInput` `onSubmit` callback

When `toolGivingFeedbackOn` is set, the form submission sends a rejection decision with the feedback as the reason:

```ts
if (toolGivingFeedbackOn) {
  sendMessage({
    parts: [
      {
        type: 'data-approval-decision',
        data: {
          toolId: toolGivingFeedbackOn.id,
          decision: {
            type: 'reject',
            reason: input,
          },
        },
      },
    ],
  });

  setToolGivingFeedbackOn(null);
  setInput('');
  return;
}
```

- [ ] Notice how the state is reset after sending the rejection feedback

The `toolGivingFeedbackOn` is set back to `null`, the input is cleared, and the flow returns to normal chat mode.

### Testing The Approval Flow

- [ ] Run the application with `pnpm run dev`

- [ ] Send a message that triggers the `sendEmail` tool, like: "Send an email to team@aihero.dev"

You should see an approval request appear with "Approve" and "Reject" buttons.

- [ ] Click the "Approve" button

A tool decision message part should appear in the history showing the approval. The buttons should disappear.

- [ ] Trigger another email request and click "Reject"

The input placeholder should change to "Please give feedback..." and you should be able to type feedback.

- [ ] Type feedback and press Enter

The rejection decision with your feedback should be sent. The UI should return to normal chat mode.
