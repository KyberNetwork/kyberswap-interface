# KyberSwap Interface — Claude Code Guide

You are working inside a pnpm-workspace + turbo monorepo.

## Repo shape

- `apps/` contains runnable apps.
- `packages/` contains shared libraries/widgets used by apps.

Primary app:

- `apps/kyberswap-interface`

## How to run (local dev)

From repo root:

- Install: `pnpm i`
- Build shared packages (if needed): `pnpm build-package`
- Run main app:
  - `cd apps/kyberswap-interface && pnpm dev`

Other apps exist under `apps/` and can be run with their own scripts.

## Coding expectations

- Prefer TypeScript and existing patterns in the codebase.
- Keep changes minimal and consistent with the surrounding code.
- Do NOT introduce new libraries unless absolutely necessary.
- Avoid refactors unrelated to the requested change.
- When unsure about conventions, search for similar patterns already used in the repo.

## Monorepo discipline

- If you change a shared package, ensure all dependents still typecheck.
- Avoid touching `pnpm-lock.yaml` unless dependency changes are explicitly required.
- Avoid modifying build tooling (turbo/pnpm configs) unless the task is specifically about tooling.

## PR hygiene

- Provide a short change summary.
- Include a quick manual test plan (what to click / what to verify).
- Flag any risky area (wallet interactions, approvals/permits, signing flows, network switching).
