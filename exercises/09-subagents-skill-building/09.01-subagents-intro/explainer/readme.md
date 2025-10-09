In this section, we're going to explore agents and subagents.

Subagents help overcome limitations of large agents. When you add lots of tools to a single agent, they often perform worse than expected.

A subagent system works via an orchestrator agent which can, itself, prompt subagents to perform work.

This approach creates a more modular system where you can isolate and test individual elements - and can be extremely powerful.

## Our Subagents

To demonstrate subagent systems, I've created a sample application that switches between four different subagents related to my former singing teaching career (yes - I was a singing teacher for 6 years).

Each of these subagents performs a specific function related to the day-to-day work of a singing teacher:

1. A to-dos agent that manages task lists
2. A student notes manager for tracking student information
3. A scheduler for handling my calendar
4. A song finder that can search the web for songs

The implementation for all these agents is in the repository. They're all using relatively simple setups with `streamText`, tool calling, and a `stopWhen: stepCountIs(10)` condition.

```ts
// Example of agent setup pattern
export const someAgent = async (opts: { prompt: string }) => {
  const streamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `System prompt that describes agent role`,
    prompt: opts.prompt,
    tools: {
      // Tool definitions
    },
    stopWhen: stepCountIs(10),
  });

  // Process results
};
```

The to-dos agent, scheduler agent, and notes agent all use a persistence layer that saves data in JSON files.

```ts
const todosDb = createPersistenceLayer<{
  todos: {
    [todoId: string]: Todo;
  };
}>({
  databasePath: join(process.cwd(), 'todos.json'),
  defaultDatabase: {
    todos: {},
  },
});
```

## The Limitation

The annoying limitation of this application is that I have to manually select which agent to use.

When you run the exercise locally, you'll notice a button to switch between agents.

If I want to perform a task that spans multiple agents - for example, finding all my lessons for tomorrow and pulling up notes for those students - there's currently no way to coordinate that information between agents.

This is exactly what we'll be building: an orchestrator agent that can select between these different specialized agents and coordinate them to perform powerful, complex tasks that span multiple domains.

Before we start building the orchestrator, I recommend you explore the code for [each agent](./api/agents/), run the exercise locally, and experiment with them to understand their capabilities. This will help you better understand the coordination challenges we'll be solving.

- [To-dos agent](./api/agents/todos-agent.ts)
- [Scheduler agent](./api/agents/scheduler-agent.ts)
- [Notes agent](./api/agents/student-notes-manager.ts)
- [Song finder agent](./api/agents/song-finder-agent.ts)

## Steps To Complete

- [ ] Explore the code for each of the four specialized agents to understand how they're implemented

- [ ] Run the exercise locally to see how the current application works

- [ ] Notice the UI has buttons to switch between agents - but no way to use multiple agents for a single task

- [ ] Understand the limitation: when you want to complete tasks that require multiple agents (like "find all lessons tomorrow and pull up their notes"), there's no coordination mechanism

- [ ] Think about how you might implement an orchestrator agent that could:
  - [ ] Understand complex requests
  - [ ] Determine which sub-agent(s) to use
  - [ ] Coordinate between multiple agents
  - [ ] Synthesize results from multiple agents into a single coherent response
