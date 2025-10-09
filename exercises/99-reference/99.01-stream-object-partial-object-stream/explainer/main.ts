import { google } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { setTimeout } from 'node:timers/promises';
import z from 'zod';

const result = streamObject({
  model: google('gemini-2.0-flash-001'),
  prompt:
    'You are generating test data for an application. Generate a large list of users.',
  schema: z.object({
    users: z.array(
      z.object({
        name: z.string(),
        email: z.string(),
        age: z.number(),
      }),
    ),
  }),
});

for await (const part of result.partialObjectStream) {
  await setTimeout(1000);
  console.clear();
  console.log(part);
}
