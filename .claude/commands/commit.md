# Generate Commit Message

Analyze the current changes and suggest a commit message.

## Instructions

1. Run `git diff --staged` to see staged changes. If nothing is staged, run `git diff` for unstaged changes.
2. Analyze the changes to understand the intent (feature, fix, refactor, chore, docs, etc.)
3. Generate a commit message following Conventional Commits format:

```
type(scope): short description

optional body with more details
```

- **type**: feat, fix, refactor, chore, docs, style, perf, test, ci
- **scope**: affected area (e.g., swap, earn, bridge, ui)
- **description**: imperative mood, lowercase, no period, under 72 chars

4. Output the suggested message. Do NOT run `git commit` or ask for confirmation.
