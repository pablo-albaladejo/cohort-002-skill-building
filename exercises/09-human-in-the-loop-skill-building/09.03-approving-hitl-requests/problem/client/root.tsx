import { useChat } from '@ai-sdk/react';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInput, Message, Wrapper } from './components.tsx';
import './tailwind.css';
import type { Action, MyMessage } from '../api/chat.ts';

const App = () => {
  const { messages, sendMessage } = useChat<MyMessage>({});

  const [input, setInput] = useState(
    `Send an email to team@aihero.dev saying what a fantastic AI workshop I'm currently attending. Thank them for the workshop.`,
  );

  const actionIdsWithDecisionsMade = useMemo(() => {
    const allMessageParts = messages.flatMap(
      (message) => message.parts,
    );

    // TODO: calculate the set of action IDs where we have
    // made a decision.
    const decisionsByActionId = TODO;

    return decisionsByActionId;
  }, [messages]);

  const [actionGivingFeedbackOn, setActionGivingFeedbackOn] =
    useState<Action | null>(null);

  return (
    <Wrapper>
      {messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          parts={message.parts}
          actionIdsWithDecisionsMade={actionIdsWithDecisionsMade}
          onActionRequest={(action, decision) => {
            // TODO: if the user has approved the action,
            // use sendMessage to send a data-action-decision
            // part with the action ID and the decision.
            //
            // TODO: if the user has rejected the action,
            // save the action in the state so that we can
            // show the feedback input.
          }}
        />
      ))}
      <ChatInput
        isGivingFeedback={!!actionGivingFeedbackOn}
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();

          // TODO: if the user is giving feedback on an action,
          // send a data-action-decision part with the action ID
          // and the reason for the rejection.

          sendMessage({
            text: input,
          });
          setInput('');
        }}
      />
    </Wrapper>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
