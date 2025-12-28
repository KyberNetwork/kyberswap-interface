# Agent Playbook (Cursor / Claude)

## Default behavior

1. Read the task carefully; restate it in 1–2 sentences.
2. Locate existing similar code before writing anything new.
3. Implement the smallest correct change.
4. Run the fastest verification loop (lint/typecheck and/or relevant tests).
5. Provide:
   - What changed
   - Where changed (files)
   - How to validate manually

## What NOT to do

- No “mega refactor” unless requested.
- No dependency/tooling changes unless requested.
- No renaming / formatting drive-by edits across unrelated files.
- Don’t modify `pnpm-lock.yaml` unless dependencies truly changed.

## Output format preference

- When you propose code changes: include file paths + snippets.
- When you propose a plan: bullet list with clear steps.
- For complex changes: include a rollback note.
