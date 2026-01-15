# Generate Tests

Generate comprehensive tests for the specified file or component.

## Instructions

1. **Analyze the target file**: Understand its purpose, inputs, outputs, and edge cases

2. **Generate test cases** for:

   - Happy path scenarios
   - Edge cases and boundary conditions
   - Error handling
   - Integration with dependencies

3. **Follow testing patterns**:
   - Use Vitest as the test runner
   - Use React Testing Library for component tests
   - Mock external dependencies appropriately
   - Use descriptive test names

## Test Structure

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

describe("ComponentName", () => {
  describe("when initial state", () => {
    it("should render correctly", () => {
      // test
    });
  });

  describe("when user interacts", () => {
    it("should handle click events", () => {
      // test
    });
  });

  describe("edge cases", () => {
    it("should handle empty data", () => {
      // test
    });
  });
});
```

## Output

- Create test file adjacent to source: `Component.test.tsx`
- Include all necessary imports
- Add comments explaining complex test scenarios
- Ensure tests are independent and can run in any order
