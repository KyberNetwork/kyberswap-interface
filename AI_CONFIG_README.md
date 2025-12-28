# AI Configuration Files

This document explains all AI-related configuration files in the KyberSwap Interface repository.

## File Structure

```
kyberswap-interface/
├── CLAUDE.md                          # Claude Code instructions (root)
├── AGENTS.md                          # Universal agent standard (root)
├── .cursorignore                      # Files to ignore in Cursor
│
├── .claude/
│   ├── settings.json                  # Claude Code permissions
│   ├── commands/                      # Slash commands
│   │   ├── explore.md                 # /explore - Analyze codebase
│   │   ├── gen-tests.md               # /gen-tests - Generate tests
│   │   ├── plan.md                    # /plan - Plan features
│   │   ├── review.md                  # /review - Code review
│   │   └── refactor.md                # /refactor - Refactor code
│   └── agents/                        # Subagents (specialists)
│       ├── code-reviewer.md           # Code review specialist
│       ├── test-generator.md          # Test generation specialist
│       ├── refactorer.md              # Refactoring specialist
│       ├── web3-expert.md             # Web3/DeFi specialist
│
├── .cursor/
│   └── rules/
│       ├── kyberswap.mdc              # Project-wide rules
│       ├── widgets.mdc                # Widget package rules
│       ├── web3.mdc                   # Web3/blockchain rules
│       └── personal/                  # Personal rules (gitignored)
│
├── apps/
│   └── kyberswap-interface/
│       └── CLAUDE.md                  # App-specific instructions
│
└── packages/
    ├── liquidity-widgets/
    │   └── CLAUDE.md                  # Package-specific instructions
    ├── zap-out-widgets/
    │   └── CLAUDE.md
    ├── zap-migration-widgets/
    │   └── CLAUDE.md
    └── pancake-liquidity-widgets/
        └── CLAUDE.md
```

## File Purposes

### Root Level

| File            | Tool        | Purpose                                       |
| --------------- | ----------- | --------------------------------------------- |
| `CLAUDE.md`     | Claude Code | Primary instructions for Claude Code sessions |
| `AGENTS.md`     | Universal   | Cross-tool standard (Cursor, Copilot, etc.)   |
| `.cursorignore` | Cursor      | Exclude files from Cursor's context           |
| `.mcp.json`     | Claude Code | MCP server configuration                      |

### .claude/ Directory

| File            | Purpose                                  |
| --------------- | ---------------------------------------- |
| `settings.json` | Permission rules (allow/deny commands)   |
| `commands/*.md` | Custom slash commands for Claude Code    |
| `agents/*.md`   | Specialized subagents for specific tasks |

### .claude/agents/ (Subagents)

Claude Code can delegate tasks to specialized subagents:

| Agent                 | Specialty                               |
| --------------------- | --------------------------------------- |
| `code-reviewer.md`    | Code review with KyberSwap conventions  |
| `test-generator.md`   | Generate Vitest + RTL tests             |
| `refactorer.md`       | Refactor code while preserving behavior |
| `web3-expert.md`      | Web3/DeFi patterns and best practices   |
| `widget-developer.md` | Widget package architecture             |
| `researcher.md`       | Codebase exploration and documentation  |

### .cursor/rules/ Directory

| File            | Trigger                 | Purpose                         |
| --------------- | ----------------------- | ------------------------------- |
| `kyberswap.mdc` | Always                  | Project-wide conventions        |
| `widgets.mdc`   | `packages/*-widgets/**` | Widget development rules        |
| `web3.mdc`      | Web3-related files      | Blockchain development patterns |

### Nested CLAUDE.md Files

Each app and package has its own `CLAUDE.md` with specific instructions for that module.

## Usage

### Claude Code

```bash
# Start Claude Code in project
claude

# Use slash commands
/explore    # Analyze codebase
/gen-tests  # Generate tests for a file
/plan       # Plan a feature
/review     # Review code
/refactor   # Refactor code

# Agents are used automatically by Claude Code
# They're invoked when tasks match their expertise
# You can also reference them explicitly:
# "Use the web3-expert agent to review this contract interaction"
```

### Cursor

Cursor automatically loads:

- `.cursor/rules/*.mdc` based on glob patterns
- `.cursorignore` for context exclusion

### Other Tools

Other AI tools (Copilot, Windsurf, etc.) should read `AGENTS.md` for project context.

## Customization

### Adding Personal Rules

Create files in `.cursor/rules/personal/` (gitignored):

```yaml
---
description: My personal preferences
alwaysApply: true
---
# My Rules
- Always add comments
- Use verbose variable names
```

### Adding New Commands

Create new `.md` files in `.claude/commands/`:

```markdown
# Command Name

Description of what this command does.

## Instructions

1. Step 1
2. Step 2

## Output Format

Expected output format
```

## Best Practices

1. **Keep instructions concise** - Long files degrade AI performance
2. **Update iteratively** - Add instructions as you discover friction points
3. **Don't duplicate linter rules** - Let linters handle code style
4. **Use examples** - Point to real files as patterns to follow
5. **Separate concerns** - Use nested files for package-specific rules
