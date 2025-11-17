Getting insights about how your system performs is great. But the real power comes when you use that data to make smarter decisions about development.

One way to make those smarter decisions is to A/B test different approaches. [Evalite](/PLACEHOLDER/evalite) has a feature called [`evalite.each()`](/PLACEHOLDER/evalite-each) that lets you run the same task with different variants to compare their performance.

In this case, you're going to test your agent with different language models to see which one gives you the best results at the lowest cost. The agent is the same, but the model changes—so you can directly compare how models like Gemini Flash Lite, Gemini 2.5 Flash, and GPT-4o mini stack up against each other.

## Steps To Complete

### Understanding The Setup

- [ ] Review the `agent.eval.ts` file and locate the [`evalite.each()`](/PLACEHOLDER/evalite-each) call

The current setup has a single model in the array:

```ts
evalite.each([
  {
    name: 'Gemini 2.0 Flash',
    input: google('gemini-2.0-flash'),
  },
])('Agent Tool Call Evaluation', {
  // ... rest of config
});
```

- [ ] Notice the `task` function receives two parameters: `messages` and `model`

The second parameter (`model`) is the variant being tested. This is passed to `runAgent()`:

```ts
task: async (messages, model) => {
  const result = runAgent(
    wrapAISDKModel(model),
    messages,
    stepCountIs(1),
  );
  // ...
};
```

### Adding More Models To Compare

- [ ] Add at least 2-3 more models to the [`evalite.each()`](/PLACEHOLDER/evalite-each) array to compare different LLM performance

You might try:

- [`google('gemini-2.0-flash-lite')`](/PLACEHOLDER/google-gemini-2.0-flash-lite) - a lighter, cheaper Gemini model
- [`google('gemini-1.5-flash')`](/PLACEHOLDER/google-gemini-1.5-flash) - an earlier version of Gemini
- Models from other providers like OpenAI or Anthropic

Here's how to add another model variant:

```ts
evalite.each([
  {
    name: 'Gemini 2.0 Flash',
    input: google('gemini-2.0-flash'),
  },
  {
    name: 'Your New Model Here',
    input: google('gemini-2.0-flash-lite'), // or another model
  },
]);
```

Check the [AI SDK documentation](/PLACEHOLDER/ai-sdk-models) for available models and how to import them.

### Optionally Add More Test Cases

- [ ] Consider adding a few more test cases to the `data` array to get a better picture of model performance

More test cases = better evaluation, but watch out—evals can get expensive quickly, especially in watch mode.

The existing test cases are:

```ts
data: [
  {
    input: createUIMessageFixture(
      'What is the weather in San Francisco right now?',
    ),
    expected: { tool: 'checkWeather' },
  },
  // ... more test cases
];
```

### Running The Evaluation

- [ ] Start the evaluation by running the watcher in your terminal

```bash
pnpm run dev
```

This will run the [Evalite](/PLACEHOLDER/evalite) runner in watch mode.

- [ ] Observe the results as each model is tested against all your test cases

You should see scores for each model variant showing how well they performed.

- [ ] Compare the results across models to find the cheapest model that achieves 100% accuracy

Look at which model gives you the best results for the lowest cost.

### Testing Your Changes

- [ ] Check the terminal output to see the evaluation results for all model variants

You should see something like:

```txt
Gemini 2.0 Flash: 5/5 (100%)
Gemini 2.0 Flash Lite: 4/5 (80%)
```

- [ ] Verify that the scoring works correctly by checking which models called the expected tools

Each model should be evaluated independently against the same test cases.
