import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const summarizeAgentOutput = async (opts: {
  onSummaryDelta: (delta: string) => void;
  initialPrompt: string;
  agentOutput: string;
}) => {
  const summarizeStreamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that summarizes a subagent's output.
      You will be given an agent's thought process and results, and you will need to summarize the results.
      You will also be given the initial prompt so you can understand the context of the output.
      Provide a summary that is relevant to the initial prompt.
      Reply as if you are the subagent.
      The user will ONLY see the summary, not the thought process or results - so make it good!
    `,
    prompt: `
      Initial prompt:
      
      ${opts.initialPrompt}

      The subagent's output is:
      
      ${opts.agentOutput}
    `,
  });

  for await (const chunk of summarizeStreamResult.textStream) {
    opts.onSummaryDelta(chunk);
  }

  return await summarizeStreamResult.text;
};
