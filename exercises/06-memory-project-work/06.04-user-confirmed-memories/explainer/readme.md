# User Confirmed Memories

LLM suggests memories for user approval before saving.

## Approach

On message:

1. LLM responds to user
2. In `onFinish`, generate suggested memories using `generateObject`
3. Send suggestions to frontend via custom data part
4. User reviews, approves/rejects each suggestion in UI
5. Frontend sends approved memories back to API
6. Save only approved memories to DB

## Pros

- User control - nothing saved without approval
- Transparency - user sees exactly what's remembered
- Accuracy - user corrects LLM mistakes
- Trust - builds confidence in memory system

## Cons

- Most complex implementation
- Requires frontend UI for approval flow
- User friction - requires interaction
- May interrupt conversation flow
- Users may ignore/skip approvals

## When to Use

- Privacy-sensitive applications
- Want user trust/transparency
- Can afford UX friction for accuracy
- Building systems where incorrect memories are costly
- Users need control over their data
