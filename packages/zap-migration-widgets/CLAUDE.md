# Zap Migration Widgets Package

Migration widget - users move or reposition LP positions between pools or protocols. Handles removing liquidity from source, swapping tokens, and adding liquidity to destination in optimized transactions.

## Main Export

`MigrationWidget` from `@kyberswap/zap-migration-widgets`

## Notes

- More complex state management than sibling packages due to two-step (source -> destination) operation
- Shares types/utilities with sibling widget packages
