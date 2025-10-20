In the next few exercises, we're going to explore one of my favorite patterns when working with AI: human in the loop.

Giving power to an LLM is a double-edged sword. The less power you give to an LLM, the less useful it is, the less it can actually do in the world. But then the more power that you give it, the more risk that you incur.

You may want an LLM to help you draft some emails. Drafting the email is perfectly fine, but do we want to be able to allow the LLM to _send_ the email too?

Ideally, we want to hand over quite a lot of power to the LLM to make it more useful. But we also want to be allowed to check the LLM's work before it goes off and does crazy things.

That's what human in the loop does. It adds human checks into the loop to make sure that the LLM is always on task.

## Why Build It Yourself?

AI SDK has first-class HITL support. So why build from scratch?

Understanding internals enables powerful extensions. Lesson 08.03 shows thread-scoped permissions - approving a tool once grants access for entire conversation. First-class solutions don't provide this. Building yourself = control over approval flows, permission models, custom behaviors.

## Custom Data Parts

We're going to be building a human in the loop system with the AI SDK's custom data parts.

And conceptually, these data parts are going to represent an 'action' in several stages.

| Data Part              | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `data-action-start`    | Signals when the LLM wants to begin an action – i.e. it's requesting to send an email.                         |
| `data-action-decision` | Captures the user's approval or rejection of the proposed action – i.e. whether to send the email or not.      |
| `data-action-end`      | Confirms when the action has been completed (only after approval) – i.e. the email has been sent successfully. |

## The Flow

These will be used like so:

| Step                     | Description                                                                                                                                         | Data Part              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **LLM Initiates Action** | When the LLM decides to perform an action (like sending an email), it 'starts' the action.                                                          | `data-action-start`    |
| **Human Review**         | The system pauses execution and presents the proposed action to the user for review.                                                                | _(none)_               |
| **User Decision**        | The user can either approve or reject the action, which creates a `data-action-decision` event. If rejected, they provide a reason to help improve. | `data-action-decision` |
| **Action Execution**     | Only after approval does the system proceed with `data-action-end` and actually execute the action.                                                 | `data-action-end`      |

In the next few exercises, we're going to be building this.
