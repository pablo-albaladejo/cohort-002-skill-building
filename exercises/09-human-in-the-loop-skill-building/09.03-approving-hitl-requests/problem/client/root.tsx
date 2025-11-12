import { useChat } from '@ai-sdk/react';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInput, Message, Wrapper } from './components.tsx';
import './tailwind.css';
import type {
  ToolRequiringApproval,
  MyMessage,
} from '../api/chat.ts';

const App = () => {
  const { messages, sendMessage } = useChat<MyMessage>({});

  const [input, setInput] = useState(
    `Send an email to team@aihero.dev saying what a fantastic AI workshop I'm currently attending. Thank them for the workshop.`,
  );

  // We look in the message history to see if we've
  // made a decision for any tools, and track them in a set.
  const toolIdsWithDecisionsMade: Set<string> = useMemo(() => {
    const allMessageParts = messages.flatMap(
      (message) => message.parts,
    );

    // TODO: calculate the set of tool IDs where we have
    // made a decision.
    const decisionsByToolId = TODO;

    return decisionsByToolId;
  }, [messages]);

  const [toolGivingFeedbackOn, setToolGivingFeedbackOn] =
    useState<ToolRequiringApproval | null>(null);

  return (
    <Wrapper
      messages={messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          parts={message.parts}
          toolIdsWithDecisionsMade={toolIdsWithDecisionsMade}
          onToolDecision={(tool, decision) => {
            // TODO: if the user has approved the tool,
            // use sendMessage to send a data-approval-decision
            // part with the tool ID and the decision.
            //
            // TODO: if the user has rejected the tool,
            // save the tool in the state so that we can
            // show the feedback input.
          }}
        />
      ))}
      input={
        <ChatInput
          isGivingFeedback={!!toolGivingFeedbackOn}
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault();

            // TODO: if the user is giving feedback on an tool,
            // send a data-approval-decision part with the tool ID
            // and the reason for the rejection.

            sendMessage({
              text: input,
            });
            setInput('');
          }}
        />
      }
    />
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
