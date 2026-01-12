# Plan Feature Implementation

Create a detailed implementation plan for a new feature or change.

## Planning Process

1. **Understand Requirements**

   - What is the feature/change?
   - What problem does it solve?
   - Who are the users?

2. **Research Existing Code**

   - Find similar implementations in the codebase
   - Identify reusable components/hooks
   - Understand current patterns

3. **Design Solution**

   - Component hierarchy
   - State management approach
   - API/data requirements
   - Error handling strategy

4. **Break Down Tasks**

   - List all files to create/modify
   - Estimate complexity (S/M/L)
   - Identify dependencies between tasks

5. **Identify Risks**
   - Breaking changes
   - Performance concerns
   - Edge cases

## Output Format

```markdown
# Feature: [Feature Name]

## Overview

[Brief description]

## Technical Design

### Components

- [ ] `ComponentA.tsx` - [purpose]
- [ ] `ComponentB.tsx` - [purpose]

### Hooks

- [ ] `useFeatureHook.ts` - [purpose]

### State Changes

- [ ] Redux slice / Zustand store changes

### API Integration

- [ ] Endpoints needed
- [ ] Data transformations

## Implementation Steps

1. [ ] Step 1 (S) - Description
2. [ ] Step 2 (M) - Description
3. [ ] Step 3 (L) - Description

## Testing Strategy

- Unit tests for: ...
- Integration tests for: ...

## Risks & Mitigations

- Risk 1: Mitigation
- Risk 2: Mitigation
```

## Guidelines

- Be specific about file paths
- Reference existing patterns in codebase
- Consider backwards compatibility
- Include rollback strategy for risky changes
