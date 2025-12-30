# Code Review

Perform a thorough code review of the specified file or changes.

## Review Checklist

### Code Quality

- [ ] Follows project conventions (see CLAUDE.md)
- [ ] TypeScript types are correct and complete
- [ ] No `any` types without justification
- [ ] Functions have appropriate return types
- [ ] Error handling is comprehensive

### React Best Practices

- [ ] Components are functional (no class components)
- [ ] Hooks follow rules of hooks
- [ ] Dependencies arrays are correct
- [ ] No unnecessary re-renders
- [ ] Keys are stable and unique in lists

### Performance

- [ ] useMemo/useCallback used appropriately
- [ ] No expensive computations in render
- [ ] Large lists are virtualized if needed
- [ ] Images/assets are optimized

### Security

- [ ] No sensitive data exposed
- [ ] User input is validated
- [ ] No XSS vulnerabilities
- [ ] Addresses are checksummed

### Web3 Specific

- [ ] BigInt used for token amounts
- [ ] Transaction errors handled
- [ ] Loading/pending states shown
- [ ] Gas estimation considered

### Testing

- [ ] Tests cover happy path
- [ ] Tests cover edge cases
- [ ] Mocks are appropriate
- [ ] Tests are independent

## Output Format

```markdown
## Code Review: [filename]

### ✅ Good

- Point 1
- Point 2

### ⚠️ Suggestions

- Suggestion 1 (line X)
- Suggestion 2 (line Y)

### ❌ Issues

- Issue 1 (line X) - [severity: high/medium/low]
- Issue 2 (line Y) - [severity: high/medium/low]

### 💡 Improvements

- Optional improvement 1
- Optional improvement 2
```
