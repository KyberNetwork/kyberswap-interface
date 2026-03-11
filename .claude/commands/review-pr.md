# Review Pull Request

Review a GitHub pull request thoroughly and provide actionable feedback.

**PR**: $ARGUMENTS

## Instructions

- Accept a PR number or GitHub PR URL
- Use `gh pr diff` to get the changes and `gh pr view` to get PR description
- Review the full diff, not just individual files in isolation
- Focus on real issues, not style nitpicks

## Review Checklist

### Logic & Correctness
- Business logic is correct
- Edge cases are handled
- No regressions introduced

### Code Quality
- TypeScript types are correct (no unjustified `any`)
- Error handling is appropriate
- Follows project conventions (see CLAUDE.md)

### React & Performance
- Hooks follow rules of hooks with correct dependency arrays
- No unnecessary re-renders
- Components have single responsibility

### Security & Web3
- No sensitive data exposed
- User input validated, no XSS
- BigInt used for token amounts
- Transaction errors handled with user feedback

## Output Format

Organize findings by severity:
1. **Issues** (must fix): Bugs, security problems, incorrect logic
2. **Suggestions** (should fix): Improvements that meaningfully improve quality
3. **Nits** (optional): Minor improvements, take-or-leave

Include file paths and line numbers for each finding.
