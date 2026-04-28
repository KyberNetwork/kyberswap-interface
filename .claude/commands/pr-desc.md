# Generate PR Title & Description

Analyze the current branch changes and generate a PR title and description.

## Instructions

1. Run `git diff main...HEAD --stat` and `git diff main...HEAD` to see what the branch *actually changes vs main*. **This is the source of truth** for the PR description.
2. Optionally run `git log main..HEAD --oneline` ONLY to help group changes thematically — never to populate bullets directly. Commit messages may describe transient/intermediate work that is no longer in the final diff.
3. Understand the overall purpose: what does this branch *deliver*?

## Output

Suggest a PR title and description in this format:

**Title**: Short, clear summary (under 70 chars)

**Description**:

```
## Summary
- Bullet points of key changes
```

Present the output and ask if the user wants to create the PR with `gh pr create`.

## CRITICAL RULES — base the description strictly on `git diff main...HEAD`

The PR description tells the reviewer what merging this branch into main will change. Nothing else.

- **Only reference what appears in the final diff.** If a file was created and then deleted on the branch, it's not in the diff and must not appear in the description — neither the file nor the reasoning that led to its removal. Same for code that was added then reverted, or refactors that were rolled back.
- **Do not mirror the commit log.** Commits describe the journey; the diff describes the destination. Use `git log` only to *group* the diff thematically. A commit that "fixes a regression introduced by an earlier commit on the same branch" is not a deliverable — the net effect is zero, so it doesn't go in the description.
- **Do not mention author mistakes or course-corrections made during development.** "Restore X that was accidentally removed earlier in this branch" is internal noise — to a reviewer reading the PR after merge, X is simply unchanged.
- **Do not mention the tools or process used to arrive at the change.** No "verified with grep", "knip flagged", "tsc clean", "ran tests", "review pass", etc. Tools used during development do not belong in a PR description.
- **Do not invent context from memory or prior conversation.** If the diff doesn't show it, don't claim it. Read the actual diff.
- **Do not add a "Test plan" / "Testing" / "QA" section unless the change has specific, non-obvious verification steps.** Generic checklists like "smoke test main flows", "verify wallet connects", "run lint and type-check" are checklist theater — they don't help reviewers and nobody executes them. Only include a test plan when there is a concrete user-facing behavior worth calling out (e.g. "verify the new redirect from `/old` to `/new`"). Default to no test plan section. Keep the description focused on the Summary.

The PR description answers: "what does merging this branch deliver to main, and why?" — not "what happened during development of this branch?"
