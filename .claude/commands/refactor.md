# Refactor Code

Refactor the specified code while maintaining functionality.

**Target**: $ARGUMENTS

## Instructions

1. Read and understand the target code thoroughly
2. Identify code smells: duplication, complexity, unclear naming, mixed responsibilities
3. Plan specific refactoring steps
4. Make changes incrementally
5. After refactoring, run `pnpm lint` and `pnpm type-check` to verify

## Principles

- **Preserve Behavior**: All existing functionality must work identically
- **Improve Readability**: Code should be easier to understand
- **Reduce Complexity**: Simplify where possible
- **Follow Patterns**: Match existing codebase conventions from CLAUDE.md

## Output

Provide:
- Summary of changes made
- Any breaking changes or migration steps needed
- Verification results from lint and type-check
