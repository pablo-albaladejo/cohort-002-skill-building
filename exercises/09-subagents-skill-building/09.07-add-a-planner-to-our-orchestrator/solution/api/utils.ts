import type { ModelMessage } from 'ai';

export const formatModelMessages = (
  messages: ModelMessage[],
) => {
  return messages
    .map((message) => {
      let content: string;

      if (typeof message.content === 'string') {
        content = message.content;
      } else {
        content = message.content
          .map((part) => {
            if (part.type === 'text') {
              return part.text;
            }

            if (part.type === 'tool-call') {
              return [
                `Tool call: ${part.toolName}`,
                `Input: ${JSON.stringify(part.input)}`,
              ].join('\n');
            }

            if (part.type === 'tool-result') {
              return [
                `Tool result: ${part.toolName}`,
                `Output: ${JSON.stringify(part.output)}`,
              ].join('\n');
            }
          })
          .filter((part) => part !== undefined)
          .join('\n\n');
      }

      return [
        message.role === 'user' ? 'User:' : 'Assistant:',
        content,
      ].join('\n\n');
    })
    .join('\n\n');
};
