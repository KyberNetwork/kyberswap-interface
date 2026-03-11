# Generate PR Title & Description

Analyze the current branch changes and generate a PR title and description.

## Instructions

1. Run `git log main..HEAD --oneline` to see all commits on this branch
2. Run `git diff main...HEAD` to see the full diff against main
3. Understand the overall purpose of the changes

## Output

Suggest a PR title and description in this format:

**Title**: Short, clear summary (under 70 chars)

**Description**:

```
## Summary
- Bullet points of key changes
```

Present the output and ask if the user wants to create the PR with `gh pr create`.
