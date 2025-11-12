import type {
  ToolRequiringApproval,
  ToolApprovalDecision,
  MyMessage,
} from './chat.ts';

export type HITLError = {
  message: string;
  status: number;
};

export type HITLDecisionsToProcess = {
  tool: ToolRequiringApproval;
  decision: ToolApprovalDecision;
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

  // Get all the tools that the assistant has started
  const tools = mostRecentAssistantMessage.parts
    .filter((part) => part.type === 'data-approval-request')
    .map((part) => part.data.tool);

  // Get all the decisions that the user has made
  const decisions = new Map(
    mostRecentUserMessage.parts
      .filter((part) => part.type === 'data-approval-decision')
      .map((part) => [part.data.toolId, part.data.decision]),
  );

  const decisionsToProcess: HITLDecisionsToProcess[] = [];

  for (const tool of tools) {
    const decision = decisions.get(tool.id);

    // If no decision is found, return an error - the user
    // should make a decision before continuing.
    if (!decision) {
      return {
        message: `No decision found for tool ${tool.id}`,
        status: 400,
      };
    }

    decisionsToProcess.push({
      tool,
      decision,
    });
  }

  return decisionsToProcess;
};
