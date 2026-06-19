# Generate Commit Message

Analyze the current changes and suggest a commit message.

## Instructions

1. Run `git diff --staged` to see staged changes. If nothing is staged, run `git diff` for unstaged changes.
2. Analyze ONLY the diff output to understand what actually changed.
3. Generate a commit message following Conventional Commits format:

```
type(scope): short description

optional body with more details
```

- **type**: feat, fix, refactor, chore, docs, style, perf, test, ci
- **scope**: affected area (e.g., swap, earn, bridge, ui)
- **description**: imperative mood, lowercase, no period, under 72 chars

4. Output the suggested message. Do NOT run `git commit` or ask for confirmation.

## CRITICAL RULES — base the message strictly on the diff

The commit message describes the final state of the diff. Nothing else.

- **Only reference what appears in the diff.** If a file does not appear in the diff output, it must not appear in the message — regardless of what was created, edited, or discussed earlier in the conversation.
- **Do not reference past actions, intermediate work, or reasoning from the conversation.** If during the session we created file A, decided it was unused, and deleted it, file A is not in the diff and the message must not mention it, the chain of reasoning that led to its deletion, or any related logic. The diff is the only source of truth.
- **Do not mention the tools or process used to arrive at the change.** No "verified with grep", "knip flagged", "tsc clean", "lint clean", "build OK", "verified by running tests", etc. Tools used during development do not belong in a commit message that lives in git history forever.
- **Do not mention the review/verification workflow.** The fact that you ran agents, did a review pass, or ran checks is irrelevant to what changed.

The commit message answers: "what does this diff do, and why?" — not "what did we do during the session to produce it?"
