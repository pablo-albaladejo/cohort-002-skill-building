import { stepCountIs, type UIMessage } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';

evalite.each([
  {
    name: 'GPT-4.1 Mini',
    input: openai('gpt-4.1-mini'),
  },
])('Agent Tool Call Evaluation', {
  data: [
    {
      input: createUIMessageFixture(
        'What is the weather in San Francisco right now?',
      ),
      expected: { tool: 'checkWeather' },
    },
    {
      input: createUIMessageFixture(
        'Create a spreadsheet called "Q4 Sales" with columns for Date, Product, and Revenue',
      ),
      expected: { tool: 'createSpreadsheet' },
    },
    {
      input: createUIMessageFixture(
        'Send an email to john@example.com with subject "Meeting Tomorrow" and body "Don\'t forget our 2pm meeting"',
      ),
      expected: { tool: 'sendEmail' },
    },
    {
      input: createUIMessageFixture(
        'Translate "Hello world" to Spanish',
      ),
      expected: { tool: 'translateText' },
    },
    {
      input: createUIMessageFixture(
        'Set a reminder for tomorrow at 9am to call the dentist',
      ),
      expected: { tool: 'setReminder' },
    },
    {
      input: createUIMessageFixture(
        'Book a flight from New York to London on December 15th, returning on December 22nd',
      ),
      expected: { tool: 'bookFlight' },
    },
    {
      input: createUIMessageFixture('Convert 1000 USD to Euros'),
      expected: { tool: 'convertCurrency' },
    },
    {
      input: createUIMessageFixture(
        'Find my calendar events for next Monday',
      ),
      expected: { tool: 'searchCalendarEvents' },
    },
  ],
  task: async (messages, model) => {
    const result = runAgent(model, messages, stepCountIs(1));

    await result.consumeStream();

    const toolCalls = (await result.toolCalls).map(
      (toolCall) => ({
        toolName: toolCall.toolName,
        input: toolCall.input,
      }),
    );

    return {
      toolCalls,
      text: await result.text,
    };
  },
  scorers: [
    {
      name: 'Matches Expected Tool',
      description: 'The agent called the expected tool',
      scorer: ({ output, expected }) => {
        return output.toolCalls.some(
          (toolCall) => toolCall.toolName === expected?.tool,
        )
          ? 1
          : 0;
      },
    },
  ],
});
