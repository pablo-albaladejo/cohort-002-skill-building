import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';

export type MyMessage = UIMessage<
  unknown,
  {
    hello: string;
    goodbye: string;
  }
>;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const helloId = crypto.randomUUID();
      const goodbyeId = crypto.randomUUID();

      writer.write({
        type: 'data-hello',
        id: helloId,
        data: 'Bonjour!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-goodbye',
        id: goodbyeId,
        data: 'Au revoir!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-hello',
        id: helloId,
        data: 'Guten Tag!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-goodbye',
        id: goodbyeId,
        data: 'Auf Wiedersehen!',
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
