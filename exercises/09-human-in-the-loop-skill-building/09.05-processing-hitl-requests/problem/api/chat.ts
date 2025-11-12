import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  hasToolCall,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import z from 'zod';
import { sendEmail } from './email-service.ts';
import { findDecisionsToProcess } from './hitl-processor.ts';

export type ToolRequiringApproval = {
  id: string;
  type: 'send-email';
  content: string;
  to: string;
  subject: string;
};

export type ToolApprovalDecision =
  | {
      type: 'approve';
    }
  | {
      type: 'reject';
      reason: string;
    };

export type MyMessage = UIMessage<
  unknown,
  {
    'approval-request': {
      tool: ToolRequiringApproval;
    };
    'approval-decision': {
      // The original tool ID that this decision is for.
      toolId: string;
      decision: ToolApprovalDecision;
    };
    // TODO: declare an approval-end part that contains
    // the output of the tool. This should contain
    // the id and output of the tool.
    'approval-end': TODO;
  }
>;

const getDiary = (messages: MyMessage[]): string => {
  return messages
    .map((message): string => {
      return [
        message.role === 'user'
          ? '## User Message'
          : '## Assistant Message',
        message.parts
          .map((part): string => {
            if (part.type === 'text') {
              return part.text;
            }

            if (part.type === 'data-approval-request') {
              if (part.data.tool.type === 'send-email') {
                return [
                  'The assistant requested to send an email:',
                  `To: ${part.data.tool.to}`,
                  `Subject: ${part.data.tool.subject}`,
                  `Content: ${part.data.tool.content}`,
                ].join('\n');
              }

              return '';
            }

            if (part.type === 'data-approval-decision') {
              if (part.data.decision.type === 'approve') {
                return 'The user approved the tool.';
              }

              return `The user rejected the tool: ${part.data.decision.reason}`;
            }

            // TODO: if the part is a data-approval-end,
            // return a string that describes the output of
            // the tool.

            return '';
          })
          .join('\n\n'),
      ].join('\n\n');
    })
    .join('\n\n');
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const mostRecentUserMessage = messages[messages.length - 1];

  // TODO: return a Response of status 400 if there
  // is no most recent user message.

  // NOTE: assistant messages are allowed to be undefined,
  // since at the very start of the conversation we'll only
  // have a user message.
  const mostRecentAssistantMessage = messages.findLast(
    (message) => message.role === 'assistant',
  );

  const hitlResult = findDecisionsToProcess({
    mostRecentUserMessage,
    mostRecentAssistantMessage,
  });

  // NOTE: if hitlResult returns a HITLError,
  // we should return a Response with the error message
  if ('status' in hitlResult) {
    return new Response(hitlResult.message, {
      status: hitlResult.status,
    });
  }

  console.dir(hitlResult, { depth: null });

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const streamTextResponse = streamText({
        model: google('gemini-2.5-flash'),
        system: `
          You are a helpful assistant that can send emails.
          You will be given a diary of the conversation so far.
          The user's name is "John Doe".
        `,
        prompt: getDiary(messages),
        tools: {
          sendEmail: {
            description: 'Send an email',
            inputSchema: z.object({
              to: z.string(),
              subject: z.string(),
              content: z.string(),
            }),
            execute: ({ to, subject, content }) => {
              writer.write({
                type: 'data-approval-request',
                data: {
                  tool: {
                    id: crypto.randomUUID(),
                    type: 'send-email',
                    to,
                    subject,
                    content,
                  },
                },
              });

              return 'Requested to send an email';
            },
          },
        },
        stopWhen: [stepCountIs(10), hasToolCall('sendEmail')],
      });

      writer.merge(streamTextResponse.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
