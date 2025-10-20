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

export type Action = {
  id: string;
  type: 'send-email';
  content: string;
  to: string;
  subject: string;
};

export type ActionOutput = {
  type: 'send-email';
  message: string;
};

export type ActionDecision =
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
    'action-start': {
      action: Action;
    };
    'action-decision': {
      // The original action ID that this decision is for.
      actionId: string;
      decision: ActionDecision;
    };
    'action-end': {
      output: ActionOutput;
      // The original action ID that this output is for.
      actionId: string;
    };
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

            if (part.type === 'data-action-start') {
              if (part.data.action.type === 'send-email') {
                return [
                  'The assistant requested to send an email:',
                  `To: ${part.data.action.to}`,
                  `Subject: ${part.data.action.subject}`,
                  `Content: ${part.data.action.content}`,
                ].join('\n');
              }

              return '';
            }

            if (part.type === 'data-action-decision') {
              if (part.data.decision.type === 'approve') {
                return 'The user approved the action.';
              }

              return `The user rejected the action: ${part.data.decision.reason}`;
            }

            if (part.type === 'data-action-end') {
              if (part.data.output.type === 'send-email') {
                return `The action was performed: ${part.data.output.message}`;
              }

              return '';
            }

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

  if (!mostRecentUserMessage) {
    return new Response('Messages array cannot be empty', {
      status: 400,
    });
  }

  if (mostRecentUserMessage.role !== 'user') {
    return new Response('Last message must be a user message', {
      status: 400,
    });
  }

  const mostRecentAssistantMessage = messages.findLast(
    (message) => message.role === 'assistant',
  );

  const hitlResult = findDecisionsToProcess({
    mostRecentUserMessage,
    mostRecentAssistantMessage,
  });

  if ('status' in hitlResult) {
    return new Response(hitlResult.message, {
      status: hitlResult.status,
    });
  }

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const messagesAfterHitl: MyMessage[] = messages;

      for (const { action, decision } of hitlResult) {
        if (decision.type === 'approve') {
          // Perform the action
          sendEmail({
            to: action.to,
            subject: action.subject,
            content: action.content,
          });

          const messagePart: MyMessage['parts'][number] = {
            type: 'data-action-end',
            data: {
              actionId: action.id,
              output: {
                type: action.type,
                message: 'Email sent',
              },
            },
          };

          // Write the result of the action to the stream
          writer.write(messagePart);

          // Add the message part to the messages array
          messagesAfterHitl[
            messagesAfterHitl.length - 1
          ]!.parts.push(messagePart);
        } else {
          const messagePart: MyMessage['parts'][number] = {
            type: 'data-action-end',
            data: {
              actionId: action.id,
              output: {
                type: action.type,
                message: 'Email not sent: ' + decision.reason,
              },
            },
          };

          // Write the result of the action to the stream
          writer.write(messagePart);

          // Add the message part to the messages array
          messagesAfterHitl[
            messagesAfterHitl.length - 1
          ]!.parts.push(messagePart);
        }
      }

      console.log(getDiary(messagesAfterHitl));

      const streamTextResponse = streamText({
        model: google('gemini-2.0-flash-001'),
        system: `
          You are a helpful assistant that can send emails.
          You will be given a diary of the conversation so far.
          The user's name is "John Doe".
        `,
        prompt: getDiary(messagesAfterHitl),
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
                type: 'data-action-start',
                data: {
                  action: {
                    id: crypto.randomUUID(),
                    type: 'send-email',
                    to,
                    subject,
                    content,
                  },
                },
              });

              return 'Email sent';
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
