import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import z from 'zod';
import { sendEmail } from './email-service.ts';

export type ToolRequiringApproval = {
  id: string;
  type: 'send-email';
  content: string;
  to: string;
  subject: string;
};

export type MyMessage = UIMessage<
  unknown,
  {
    'approval-request': {
      tool: ToolRequiringApproval;
    };
  }
>;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const streamTextResponse = streamText({
        model: google('gemini-2.5-flash'),
        system: `
          You are a helpful assistant that can send emails.
          You will be given a diary of the conversation so far.
          The user's name is "John Doe".
        `,
        messages: convertToModelMessages(messages),
        tools: {
          sendEmail: {
            description: 'Send an email',
            inputSchema: z.object({
              to: z.string(),
              subject: z.string(),
              content: z.string(),
            }),
            execute: async ({ to, subject, content }) => {
              // TODO: change this so that it sends a part
              // of data-approval-request to the writer instead of
              // sending the email.
              await sendEmail({ to, subject, content });

              return 'Requested to send an email';
            },
          },
        },
        // TODO: we now want a second stop condition - we
        // want to stop EITHER when the step count is 10,
        // OR when the agent has sent the sendEmail tool call.
        stopWhen: [stepCountIs(10)],
      });

      writer.merge(streamTextResponse.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
