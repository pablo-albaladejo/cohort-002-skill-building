# Creating Synthetic Datasets

## Learning Goals

Scale eval testing via LLM-generated synthetic data. Learn when `generateText` (simple output) vs `generateObject` (structured data) is appropriate. Prompt engineer diverse, realistic conversations across 4 scenario types: happy path (obvious memorization), situational only (obvious skip), edge case mixed (requires filtering), adversarial privacy (sensitive data to reject). Build datasets systematically rather than manual curation.

## Steps To Complete

### 1. Implement `generatePersona()` prompt

Uses `generateText` for simple paragraph output. System prompt provided. Complete user prompt.

```ts
async function generatePersona(
  scenarioType: (typeof SCENARIO_TYPES)[number],
) {
  // TODO: Use generateText to create a persona description
  const result = await generateText({
    model: google('gemini-2.0-flash-lite'),
    system: `You generate realistic user personas for creating synthetic conversation datasets.

Create diverse personas with different occupations, backgrounds, and ages.
For privacy scenarios, create contexts where sensitive info might accidentally slip out.
Make personas feel realistic, not stereotypical.`,
    prompt: `TODO: Write a prompt that generates a user persona for: ${scenarioType.description}

Include name, occupation, interests, communication preferences, and relevant context.`,
  });

  return result.text;
}
```

**Notes:**
- Request specific attributes: name, occupation, interests, communication style, relevant context
- Emphasize realism over stereotypes
- For privacy scenarios, create situations where sensitive info naturally surfaces
- Output format: natural paragraph, not structured data

### 2. Implement `generateConversation()` prompt

Uses `generateObject` for structured conversation turns. System prompt and schema provided. Complete user prompt.

```ts
async function generateConversation(
  persona: string,
  scenarioType: (typeof SCENARIO_TYPES)[number],
) {
  // TODO: Use generateObject to create a realistic conversation
  const result = await generateObject({
    model: google('gemini-2.0-flash-lite'),
    schema: conversationSchema,
    system: `You generate realistic conversations between users and AI assistants for synthetic datasets.

Generate 4-6 conversational turns (alternating user/assistant).
Make conversations feel natural, not forced.
Users should reveal information organically through conversation.
Assistant should be helpful and responsive.`,
    prompt: `TODO: Write a prompt that generates a conversation for: ${scenarioType.description}

Use this persona:
${persona}

Use this guidance:
${getScenarioGuidance(scenarioType.type)}`,
  });

  return result.object;
}
```

**Notes:**
- Inject persona and scenario guidance into prompt
- Request 4-6 turns alternating user/assistant roles
- Information should emerge organically, not forcefully
- Natural dialogue patterns, realistic phrasing
- Schema enforces structure: `{ turns: Array<{ role, content }> }`

### 3. Run and validate output

```bash
pnpm tsx problem/main.ts
```

Check `synthetic-conversations.json`:
- 12 conversations generated (3 per scenario type)
- Variety across personas (different ages, occupations, contexts)
- Natural conversation flow
- Scenario coverage:
  - Happy path: clear permanent info shared
  - Situational only: no permanent info
  - Edge case mixed: both permanent and temporary
  - Adversarial privacy: sensitive data present

**Notes:**
- Iterate prompts if output too generic or unrealistic
- Verify scenario types distribute correctly
- Check conversation naturalness and diversity
- Ensure privacy scenarios include realistic sensitive data patterns (SSN fragments, password mentions, credit card context)

## Output Format

```json
{
  "generatedAt": "2025-10-13T...",
  "totalConversations": 12,
  "scenarioDistribution": ["happy-path", "situational-only", "edge-case-mixed", "adversarial-privacy"],
  "conversations": [
    {
      "conversationId": "conv-1",
      "scenarioType": "happy-path",
      "persona": "Sarah Chen is a 32-year-old software engineer...",
      "turns": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
  ]
}
```

## Key Distinctions

**`generateText` use case:**
- Simple unstructured output
- Persona descriptions (paragraph format)
- No schema enforcement needed

**`generateObject` use case:**
- Structured data with defined shape
- Conversation turns array
- Schema validation via Zod
- Type-safe output

**Prompt engineering principles:**
- Inject dynamic context (persona, scenario guidance)
- Request specific attributes explicitly
- Emphasize naturalness and variety
- Provide examples or anti-patterns when needed
