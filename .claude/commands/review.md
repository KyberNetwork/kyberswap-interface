# Code Review

Perform a thorough code review.

**Target**: $ARGUMENTS

## Instructions

- If a file path is specified, review that file
- If no target is specified, review the current uncommitted changes (`git diff` and `git diff --staged`)
- Focus on real issues, not style nitpicks

## Review Checklist

### Code Quality
- TypeScript types are correct (no unjustified `any`)
- Error handling is appropriate
- Follows project conventions (see CLAUDE.md)

### React & Performance
- Hooks follow rules of hooks with correct dependency arrays
- No unnecessary re-renders (useMemo/useCallback used appropriately)
- Components have single responsibility

### Security
- No sensitive data exposed
- User input is validated
- No XSS vulnerabilities

### Web3 Specific
- BigInt used for token amounts (not floating point)
- Transaction errors handled with appropriate user feedback
- Loading/pending states shown during async operations

## Output Format

Organize findings by severity:
1. **Issues** (must fix): Bugs, security problems, incorrect logic
2. **Suggestions** (should fix): Improvements that meaningfully improve quality
3. **Nits** (optional): Minor improvements, take-or-leave
