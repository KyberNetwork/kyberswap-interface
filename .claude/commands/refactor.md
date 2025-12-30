# Refactor Code

Refactor the specified code while maintaining functionality.

## Refactoring Principles

1. **Preserve Behavior**: All existing functionality must work identically
2. **Improve Readability**: Code should be easier to understand
3. **Reduce Complexity**: Simplify where possible
4. **Follow Patterns**: Match existing codebase conventions

## Common Refactoring Tasks

### Extract Component

```typescript
// Before: Large component with multiple responsibilities
// After: Smaller, focused components

// Extract to: components/TokenAmount.tsx
const TokenAmount = ({ amount, decimals, symbol }: Props) => (
  <span>{formatUnits(amount, decimals)} {symbol}</span>
)
```

### Extract Hook

```typescript
// Before: Logic mixed in component
// After: Reusable hook

// Extract to: hooks/useTokenBalance.ts
export function useTokenBalance(token: Address, account: Address) {
  // logic here
  return { balance, isLoading, refetch };
}
```

### Extract Utility

```typescript
// Before: Repeated logic
// After: Shared utility function

// Extract to: utils/format.ts
export function formatTokenAmount(amount: bigint, decimals: number): string {
  // logic here
}
```

### Simplify Conditionals

```typescript
// Before
if (condition1) {
  if (condition2) {
    doSomething();
  }
}

// After
if (condition1 && condition2) {
  doSomething();
}
```

## Process

1. **Identify the smell**: What makes this code hard to work with?
2. **Plan the refactor**: What specific changes will you make?
3. **Make changes incrementally**: One small change at a time
4. **Verify after each change**: Run lint, type-check, tests
5. **Document breaking changes**: If any exports change

## Output

Provide:

1. Summary of changes made
2. Before/after code snippets
3. Any breaking changes or migration steps
4. Verification steps run
