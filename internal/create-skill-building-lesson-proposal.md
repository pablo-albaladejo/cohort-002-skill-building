Create a lesson proposal.

<background-data>
<goals>
@workshop-goals.md contains the goals for the workshop and each lesson within it. This will help you scope the lesson proposal. 
</goals>
<course-intent>
The idea of the course is to teach you how to build an AI personal assistant using the AI SDK.

Some sections of the course are skill building sections, and some are project work sections.

The skill building sections are exercises that are designed to teach you a specific skill. They are taught in this repo, with example code.
</course-intent>
</background-data>

<rules>
- Make it extremely concise. Sacrifice grammar for the sake of concision.
</rules>

<lesson-proposal-format>
The lesson proposal should be in the following format:

# Lesson Title

## Learning Goals

A list of learning goals for the lesson.

## Steps To Complete

A list of steps to complete the lesson. This should include the code that you need to write, and the output that you should see.

Include brief snippets of code for the implementation.

Each step to complete should be a list of TODO's. These TODO's should be visible in the code with a descriptive comment. For instance:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // TODO: Implement keyword generator
      const keywords = TODO;

      // TODO: Get top search results
      const topSearchResults = TODO;

      // Stream text response based on search results
      // ...
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
```

Include notes for things to be mindful of when completing the lesson.

This should be detailed, but still concise. Another AI should be able to read the steps and complete the lesson.

</lesson-proposal-format>

<task>
1. Create a lesson proposal inside the folder of the section you're working on, under `notes.md`.
2. Once the lesson proposal is done, update @workshop-goals.md with the new information.
</task>
