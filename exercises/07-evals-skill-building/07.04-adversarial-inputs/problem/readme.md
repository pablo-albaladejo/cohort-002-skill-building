Right now, your evaluation dataset is all sunshine and roses. Every test case has the user explicitly telling the agent exactly what they want and which tool to use. But real users are usually less straightforward.

In the wild, you'll encounter ambiguous requests that could match multiple tools, long complex requests with multiple potential actions, and requests missing critical information. You'll also get conversational inputs that don't need any tool at all.

To build a robust agent, you need to challenge it with adversarial inputs that expose its weaknesses.

## Steps To Complete

### Understanding Adversarial Test Cases

- [ ] Review the current test cases in `agent.eval.ts`

The existing cases are straightforward - "Create a spreadsheet", "Translate hello world to Spanish". These are too easy because they explicitly state what the user wants.

- [ ] Understand the types of adversarial inputs you should add

These challenge different aspects of the agent's reasoning:

| Input Type                | Example                         | Why It's Tricky                                    |
| ------------------------- | ------------------------------- | -------------------------------------------------- |
| Ambiguous requests        | "Organize my schedule"          | Could mean calendar update, task creation, or both |
| Missing critical info     | "Book a flight"                 | No dates, cities, or passenger count provided      |
| Conversational input      | "Thanks!" or "That's helpful"   | No action needed at all                            |
| Hypothetical scenarios    | "What would happen if..."       | Asking about tools, not using them                 |
| Overlapping functionality | "Save this for later"           | Could be task, reminder, or backup                 |
| Long complex requests     | Multiple actions in one message | Requires prioritization and clarification          |

- [ ] Recognize when NO tool should be called

For many adversarial cases, the agent should recognize that calling a tool would be wrong and respond conversationally instead. In your test data, you'll use `expected: { tool: null }` to indicate this.

### Adding Adversarial Test Cases

- [ ] Locate the TODO comment in the test data array

You'll find a TODO comment that lists suggestions for adversarial inputs to add. This is your starting point for expanding the dataset.

- [ ] Add test cases for ambiguous requests

These should match multiple potential tools. Think about requests where the user's intent isn't crystal clear, and the agent needs to either pick the most appropriate tool or ask for clarification. Consider what would happen if someone asked to organize or save information without being specific about how.

- [ ] Add test cases with missing critical information

These requests lack essential details needed to execute a tool successfully. Think about scenarios where a user makes a request but hasn't provided all the required parameters. For example, what if someone wanted to send a message but didn't specify who to send it to?

- [ ] Add test cases for conversational input with no action

These are messages where the user is just chatting, not requesting a tool call. Consider casual greetings, thank yous, or other exchanges where the assistant should respond helpfully without invoking any tool.

- [ ] Add test cases for hypothetical scenarios

These ask about tools rather than requesting their use. Think about requests where someone is asking questions about a tool's capabilities or asking "what if" - these shouldn't trigger tool calls. Consider how someone might ask for information about a process rather than requesting that process to be executed.

- [ ] Add test cases for overlapping tool functionality

These requests could legitimately use multiple different tools. Think about requests that are vague enough that several tools in your toolkit could potentially handle them. What's something a user might say where `setReminder`, `createTask`, and `createBackup` could all technically apply?

- [ ] Add test cases for long, complex requests

These have multiple potential actions or require prioritization. Create requests that mention multiple different things the user might want done. Consider whether the agent should call the first relevant tool, ask for clarification, or handle this differently.

### Testing With Different Models

- [ ] Run the evaluation using [Evalite](/PLACEHOLDER/evalite)

```bash
pnpm run dev
```

This starts the evaluation runner in watch mode, which re-runs tests when you make changes.

- [ ] Test with multiple models to see how they handle adversarial inputs

The evaluation is already configured to test both [Gemini 2.0 Flash](/PLACEHOLDER/gemini-2.0-flash) and [GPT-4.1 Mini](/PLACEHOLDER/gpt-4.1-mini). You should see results for both models.

- [ ] Compare the results between models

Look for patterns in which types of adversarial inputs each model struggles with. One model might be better at detecting when no tool should be called, while another might be better at handling ambiguous requests.

### Analyzing Results

- [ ] Identify which adversarial inputs are causing failures

Are certain types of requests consistently being handled incorrectly? Document these patterns.

- [ ] Consider whether your test cases reflect real user behavior

Do your adversarial inputs represent the kinds of mistakes and ambiguities your actual users will introduce?

- [ ] Refine your test cases based on results

You might need to adjust your expected values, or add more nuanced test cases that better expose the agent's limitations.
