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

  // NOTE: If there's no assistant message in the chat,
  // there's nothing to process and we can proceed with
  // the conversation.
  if (!mostRecentAssistantMessage) {
    return [];
  }

  // TODO: Get all the actions from the assistant message
  // and return them in an array.
  const actions = TODO;

  // TODO: Get all the decisions that the user has made
  // and return them in a map.
  const decisions = TODO;

  const decisionsToProcess: HITLDecisionsToProcess[] = [];

  for (const action of actions) {
    const decision = decisions.get(action.id);

    // TODO: if the decision is not found, return an error -
    // the user should make a decision before continuing.
    //
    // TODO: if the decision is found, add the action and
    // decision to the decisionsToProcess array.
  }

  return decisionsToProcess;
};
