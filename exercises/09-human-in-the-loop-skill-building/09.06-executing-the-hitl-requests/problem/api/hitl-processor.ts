import type {
  Action,
  ActionDecision,
  MyMessage,
} from './chat.ts';

export type HITLError = {
  message: string;
  status: number;
};

export type HITLDecisionsToProcess = {
  action: Action;
  decision: ActionDecision;
};

export const findDecisionsToProcess = (opts: {
  mostRecentUserMessage: MyMessage;
  mostRecentAssistantMessage: MyMessage | undefined;
}): HITLError | HITLDecisionsToProcess[] => {
  const { mostRecentUserMessage, mostRecentAssistantMessage } =
    opts;

  // If there's no assistant message in the chat, there's nothing to process.
  if (!mostRecentAssistantMessage) {
    return [];
  }

  // Get all the actions that the assistant has started
  const actions = mostRecentAssistantMessage.parts
    .filter((part) => part.type === 'data-action-start')
    .map((part) => part.data.action);

  // Get all the decisions that the user has made
  const decisions = new Map(
    mostRecentUserMessage.parts
      .filter((part) => part.type === 'data-action-decision')
      .map((part) => [part.data.actionId, part.data.decision]),
  );

  const decisionsToProcess: HITLDecisionsToProcess[] = [];

  for (const action of actions) {
    const decision = decisions.get(action.id);

    // If no decision is found, return an error - the user
    // should make a decision before continuing.
    if (!decision) {
      return {
        message: `No decision found for action ${action.id}`,
        status: 400,
      };
    }

    decisionsToProcess.push({
      action,
      decision,
    });
  }

  return decisionsToProcess;
};
