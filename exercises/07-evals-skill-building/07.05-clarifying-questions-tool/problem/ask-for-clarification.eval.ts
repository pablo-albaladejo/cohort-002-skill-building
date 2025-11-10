import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
import { google } from '@ai-sdk/google';
import { stepCountIs } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';

evalite('Ask For Clarification Evaluation', {
  // TODO: Add 8-10 test cases with incomplete requests that should trigger
  // the askForClarification tool. Each case should be missing critical
  // information needed to complete the action.
  //
  // Examples:
  // - "Book a flight to Paris" (missing: dates, origin, passengers)
  // - "Send John an email" (missing: email address, subject, body)
  // - "Create an invoice" (missing: client details, items, amounts)
  // - "Set a reminder" (missing: time, what to remind about)
  // - "Translate this text" (missing: what text, target language)
  // - "Check the weather" (missing: location)
  // - "Schedule a post" (missing: content, platforms, time)
  // - "Create a task" (missing: title, description, due date)
  //
  // Mix different tools and types of missing information
  data: [
    // Flight booking with missing critical details
    {
      input: createUIMessageFixture('Book a flight to Paris'),
    },
    // Email with missing recipient details
    {
      input: createUIMessageFixture('Send John an email'),
    },
    // Invoice creation with no details
    {
      input: createUIMessageFixture(
        'Create an invoice for the client',
      ),
    },
    // TODO: add more test cases here
  ],
  task: async (input) => {
    const result = runAgent(
      google('gemini-2.0-flash'),
      input,
      stepCountIs(1),
    );

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
      name: 'Called askForClarification',
      description:
        'The agent called the askForClarification tool',
      scorer: ({ output }) => {
        // TODO: Implement the scorer
        // Return 1 if askForClarification was called, 0 otherwise
        // Hint: Check if any tool in output.toolCalls has toolName === 'askForClarification'
        return 0;
      },
    },
  ],
});
