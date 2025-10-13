# User Confirmed Memories

## Learning Goals

LLM suggests memory operations (create/update/delete) via `generateObject` in `onFinish`. Send suggestions as transient data part. UI detects via `onData`, shows alert/modal for approval. Execute only approved operations. Maximum user control with HITL pattern.

## Steps To Complete

### 1. Define Memory Suggestions Custom Data Part

Add `memory-suggestions` to `MyMessage` type for transient suggestions.

**Implementation (`src/app/api/chat/route.ts`):**

```ts
export type MyMessage = UIMessage<
  never,
  {
    'frontend-action': 'refresh-sidebar';
    'memory-suggestions': {
      updates: Array<{
        id: string;
        title: string;
        content: string;
      }>;
      deletions: string[];
      additions: Array<{
        title: string;
        content: string;
      }>;
    };
  }
>;
```

**Notes:**

- Same structure as 04.03 automatic extraction
- Will be sent as transient (doesn't persist in message history)
- Ephemeral data for approval flow only

### 2. Generate Suggestions in onFinish

Use `extractMemories()` function from 04.03, send suggestions as transient data part.

**Implementation (`src/app/api/chat/route.ts`):**

```ts
import { extractMemories } from '@/lib/extract-memories';
import { loadMemories } from '@/lib/persistence-layer';

const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // ... existing streamText code ...
  },
  generateId: () => crypto.randomUUID(),
  onFinish: async ({ responseMessage, writer }) => {
    await appendToChatMessages(chatId, [responseMessage]);

    const existingMemories = await loadMemories();
    const allMessages = [...messages, responseMessage];

    const memoryOperations = await extractMemories({
      messages: allMessages,
      existingMemories,
    });

    const { updates, deletions, additions } = memoryOperations;

    // Only send suggestions if there are operations to approve
    if (updates.length > 0 || deletions.length > 0 || additions.length > 0) {
      writer.write({
        type: 'data-memory-suggestions',
        data: {
          updates,
          deletions,
          additions,
        },
        transient: true, // Doesn't persist in message history
      });

      console.log('Memory suggestions sent:', {
        updates: updates.length,
        deletions: deletions.length,
        additions: additions.length,
      });
    }
  },
});
```

**Notes:**

- Reuses `extractMemories()` from 04.03 - same logic
- `onFinish` callback receives `writer` parameter for sending data parts
- Transient data part sent after response completes
- Only send if operations exist (avoid empty suggestions)
- Doesn't execute automatically - waits for user approval

### 3. Handle Transient Data in Chat Component

Detect `memory-suggestions` via `onData`, show alert notification.

**Implementation (`src/app/chat.tsx`):**

```tsx
import { useState } from 'react';

export const Chat = (props: { chat: DB.Chat | null }) => {
  const [pendingSuggestions, setPendingSuggestions] = useState<{
    updates: Array<{ id: string; title: string; content: string }>;
    deletions: string[];
    additions: Array<{ title: string; content: string }>;
  } | null>(null);

  const { messages, sendMessage, status } = useChat<MyMessage>({
    id: chatIdInUse,
    messages: props.chat?.messages || [],
    onData: (message) => {
      if (
        message.type === 'data-frontend-action' &&
        message.data === 'refresh-sidebar'
      ) {
        router.refresh();
      }

      // Handle memory suggestions
      if (message.type === 'data-memory-suggestions') {
        setPendingSuggestions(message.data);
        console.log('Received memory suggestions:', message.data);
      }
    },
    generateId: () => crypto.randomUUID(),
  });

  // ... rest of component
};
```

**Notes:**

- `onData` fires when transient data parts received
- Store suggestions in state for modal display
- Transient parts won't appear in `messages` array

### 4. Build Approval Modal UI

Display suggestions with approve/reject per operation.

**Implementation (`src/app/chat.tsx`):**

```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const Chat = (props: { chat: DB.Chat | null }) => {
  const [pendingSuggestions, setPendingSuggestions] = useState<...>(null);
  const [approvedOperations, setApprovedOperations] = useState<{
    updates: string[]; // IDs
    deletions: string[]; // IDs
    additions: number[]; // Indexes
  }>({
    updates: [],
    deletions: [],
    additions: [],
  });

  const handleApproveAll = async () => {
    // Approve all suggested operations
    const allUpdates = pendingSuggestions?.updates.map(u => u.id) || [];
    const allDeletions = pendingSuggestions?.deletions || [];
    const allAdditions = pendingSuggestions?.additions.map((_, i) => i) || [];

    await executeApprovedOperations({
      updates: pendingSuggestions!.updates.filter(u =>
        allUpdates.includes(u.id)
      ),
      deletions: allDeletions,
      additions: pendingSuggestions!.additions,
    });

    setPendingSuggestions(null);
    setApprovedOperations({ updates: [], deletions: [], additions: [] });
    router.refresh(); // Refresh to show updated memories
  };

  const handleRejectAll = () => {
    setPendingSuggestions(null);
    setApprovedOperations({ updates: [], deletions: [], additions: [] });
  };

  return (
    <>
      {/* Alert notification when suggestions arrive */}
      {pendingSuggestions && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="default" className="cursor-pointer text-lg p-4">
            Memory suggestions available - Click to review
          </Badge>
        </div>
      )}

      {/* Approval modal */}
      <Dialog
        open={pendingSuggestions !== null}
        onOpenChange={(open) => !open && handleRejectAll()}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Memory Suggestions</DialogTitle>
            <DialogDescription>
              The assistant suggests these memory operations.
              Review and approve/reject each one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Additions */}
            {pendingSuggestions?.additions.map((addition, i) => (
              <div key={i} className="border rounded p-4">
                <Badge variant="secondary" className="mb-2">Create</Badge>
                <h3 className="font-semibold">{addition.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {addition.content}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovedOperations(prev => ({
                        ...prev,
                        additions: [...prev.additions, i],
                      }));
                    }}
                    disabled={approvedOperations.additions.includes(i)}
                  >
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    Reject
                  </Button>
                </div>
              </div>
            ))}

            {/* Updates */}
            {pendingSuggestions?.updates.map((update) => (
              <div key={update.id} className="border rounded p-4">
                <Badge variant="secondary" className="mb-2">Update</Badge>
                <h3 className="font-semibold">{update.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {update.content}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovedOperations(prev => ({
                        ...prev,
                        updates: [...prev.updates, update.id],
                      }));
                    }}
                    disabled={approvedOperations.updates.includes(update.id)}
                  >
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    Reject
                  </Button>
                </div>
              </div>
            ))}

            {/* Deletions */}
            {pendingSuggestions?.deletions.map((deletionId) => {
              const memory = existingMemories.find(m => m.id === deletionId);
              return (
                <div key={deletionId} className="border rounded p-4">
                  <Badge variant="destructive" className="mb-2">Delete</Badge>
                  <h3 className="font-semibold">{memory?.title || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {memory?.content}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setApprovedOperations(prev => ({
                          ...prev,
                          deletions: [...prev.deletions, deletionId],
                        }));
                      }}
                      disabled={approvedOperations.deletions.includes(deletionId)}
                    >
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleApproveAll}>Approve All</Button>
            <Button variant="outline" onClick={handleRejectAll}>
              Reject All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ... rest of chat UI ... */}
    </>
  );
};
```

**Notes:**

- Dialog opens automatically when suggestions received
- Badge colors: secondary (create/update), destructive (delete)
- Track approved operations separately from suggestions
- "Approve All" / "Reject All" for bulk actions
- Close dialog clears pending state

### 5. Execute Approved Operations

Send approved operations to server action, execute via persistence layer.

**Implementation (`src/app/actions/memories.ts`):**

```ts
"use server";

import {
  createMemory,
  updateMemory,
  deleteMemory,
} from '@/lib/persistence-layer';

export async function executeApprovedMemoryOperations(opts: {
  updates: Array<{ id: string; title: string; content: string }>;
  deletions: string[];
  additions: Array<{ title: string; content: string }>;
}): Promise<{ success: boolean }> {
  const { updates, deletions, additions } = opts;

  console.log('Executing approved operations:', {
    updates: updates.length,
    deletions: deletions.length,
    additions: additions.length,
  });

  // Filter deletions to avoid conflicts with updates
  const filteredDeletions = deletions.filter(
    deletion => !updates.some(update => update.id === deletion)
  );

  // Execute updates
  for (const update of updates) {
    await updateMemory(update.id, {
      title: update.title,
      content: update.content,
    });
    console.log(`Updated memory: ${update.id}`);
  }

  // Execute deletions
  for (const deletionId of filteredDeletions) {
    await deleteMemory(deletionId);
    console.log(`Deleted memory: ${deletionId}`);
  }

  // Execute additions
  for (const addition of additions) {
    await createMemory({
      id: crypto.randomUUID(),
      title: addition.title,
      content: addition.content,
    });
    console.log(`Created memory: ${addition.title}`);
  }

  return { success: true };
}
```

**Implementation (call from `src/app/chat.tsx`):**

```tsx
import { executeApprovedMemoryOperations } from './actions/memories';

const handleApproveAll = async () => {
  if (!pendingSuggestions) return;

  await executeApprovedMemoryOperations({
    updates: pendingSuggestions.updates,
    deletions: pendingSuggestions.deletions,
    additions: pendingSuggestions.additions,
  });

  setPendingSuggestions(null);
  router.refresh(); // Refresh sidebar to show updated memories
};
```

**Notes:**

- Server action pattern for secure operations
- Same conflict filtering as 04.03 (avoid deleting what's being updated)
- Only execute operations user approved
- Refresh UI after execution

### 6. Test Approval Flow

Verify suggestions appear, approval works, rejected operations skipped.

**Testing steps:**

1. Run: `pnpm dev` in `ai-personal-assistant` repo
2. **Test additions**: "My favorite color is blue"
   - Check alert appears in top-right
   - Click to open modal
   - Verify "Create" operation shown with title/content
   - Approve, verify memory appears in sidebar
3. **Test updates**: "Actually, my favorite color is green"
   - Verify "Update" operation shown
   - Check existing memory ID referenced
   - Approve, verify memory updated
4. **Test deletions**: "I don't care about colors anymore"
   - Verify "Delete" operation shown
   - Approve, verify memory removed
5. **Test rejections**: Share personal info, reject all
   - Verify no memories created/updated
6. **Test partial approval**: Get 3 suggestions, approve only 1
   - Verify only approved operation executed
7. **Test casual chat**: "Hello, how are you?"
   - Verify no suggestions generated (no alert)

**Notes:**

- Transient parts don't persist - won't see in message history
- Console logs show when suggestions generated vs executed
- Test "Approve All" and "Reject All" buttons
- Verify refresh updates sidebar immediately

## Additional Notes

**When This Approach Works:**

- Privacy-sensitive applications requiring user control
- Systems where incorrect memories costly
- Building trust through transparency
- Users willing to review suggestions regularly
- Accuracy more important than convenience

**Limitations:**

- Most complex implementation (frontend + backend + state)
- User friction - requires interaction every time
- Users may ignore/skip approvals (approval fatigue)
- May interrupt conversation flow
- Still runs `generateObject` every message (like 04.03)

**Comparison to Other Approaches:**

- 04.02: LLM-controlled tools, transparent but no user approval
- 04.03: Automatic extraction, no user control, every message
- 04.04: User confirmation, maximum control, most friction
- Section 07 HITL: Similar pattern but for actions (emails) not memories

**Transient Data Parts:**

- Don't persist in message history (ephemeral)
- Perfect for approval flows - user sees during stream only
- Reduces token usage vs persistent parts
- Requires `onData` handler to capture

**Optimization Ideas:**

- Batch suggestions across multiple messages before showing
- Add confidence scores, auto-approve high-confidence suggestions
- Remember user preferences (always approve additions, always review deletions)
- Add "Edit before saving" option in modal

**Next Steps:**

- 04.05: Semantic recall for scaling beyond loading all memories
- Section 05: Evals for testing memory extraction quality
