# Unified Swap

Unified Swap combines same-chain EVM swaps and cross-chain swaps across EVM,
Solana, Bitcoin and NEAR, with shared token selection, settings, review, charts
and transaction history. Limit Order shares the page shell.

## Entry points

| Feature          | URL                                      |
| ---------------- | ---------------------------------------- |
| Same-chain swap  | `/swap/{network}/{pair}`                 |
| Cross-chain swap | `/swap?from=…&to=…&tokenIn=…&tokenOut=…` |
| Limit Order      | `/limit/{network}/{pair}`                |
| Embedded swap    | `/partner-swap` or `/user-swap/{tipsId}` |

## Quotes and routes

- Same-chain EVM swaps use KyberSwap routing. Unified cross-chain swaps use
  aggregator stream quotes; stream errors do not fall back to direct quotes.
- Kyber Across is removed. KyberSwap remains a same-chain source and is excluded
  from cross-chain source settings and results.
- Route options show **Best Return** and one **Fastest** badge. Fastest uses the
  lowest valid positive time estimate, then higher output to break ties.
- Cross-chain routes show one provider step, except KyberCross routes with a valid
  route plan, which show their swap/bridge steps. Same-chain routes show pool splits.
- Routes start collapsed when a supported pricing chart is enabled, and expanded
  otherwise. Chart and route visibility are separate settings.
- Pair changes clear cross-chain route selection and review. Same-pair refreshes
  retain the selected provider; opening review pauses quote refresh.
- The normal same-chain fee/tip row is hidden when no positive fee applies.
  Safe App retains its separate Platform Fee display.

## Wallets and tokens

Routes involving non-EVM chains have separate sender and receiver connections.
The EVM sender follows the app wallet; connecting an EVM receiver does not activate
it as the app wallet. EVM-to-EVM swaps keep the app-wallet behavior.

Reverse swaps the retained connections along with the pair, preserving signing
sessions and Ledger paths. An EVM receiver becomes the app wallet when reversed
into the input. Pasted recipient text stays unchanged. Wallet slots live for the
page session; the paste draft resets when the cross-chain form unmounts.

Each side reads balances for its own address, including a pasted recipient.
Browsing a different wallet family shows unknown balances without changing the
signer. Cross-chain token selection updates the pair without switching the wallet
network.

**All Networks** browses/searches EVM tokens through `KS_SETTING_API/v1/tokens`,
with API pagination and filtering to supported networks. Empty search lists
whitelisted tokens. Only the All tab is available; local imports, favorites and
non-EVM catalogs are not merged into this list. API errors offer retry. Solana,
Bitcoin and NEAR tokens remain available in their individual network views.

## History

History follows the current input wallet and merges local same-chain/cross-chain
swaps with indexed KD API records, deduplicated by source chain and transaction
hash. Complete settled API records supersede local rows; pending or incomplete
records preserve local execution data.

The History button opens history in the chart/route area. Pages contain up to
10 merged rows; token/name/address search filters the current page. Same-chain
rows show **Tx Hash**; cross-chain rows show **Deposit** and **Fill**. The processing
list shows ongoing cross-chain transactions for the input wallet.

History polling runs every 10 seconds while the swap page is mounted, independently
of History visibility. Provider/backend reconciliation also runs independently.

## Related pages and code

Partner/User Swap reuse this feature with attribution, fee/tip configuration and
embedded pair parameters (`chainId`, `toChain`, `inputCurrency`, `outputCurrency`).
`features=swap,limit` controls tabs. KyberCross reuses shared modules but owns direct
quotes, Gas Drop and separate source preferences; `/kybercross` requires the
`KYBERCROSS` testing flag. The retired `/cross-chain` route falls back to home.

Main owners: `SwapRoute` handles URLs, `SwapPage` selects the form provider,
`SwapPageContent` renders the layout, and `SwapWalletProvider` owns wallet slots.
Shared form logic lives in `src/components/SwapForm`, provider integrations in
`src/pages/Swap/crossChain`, and history in `src/pages/Swap/transactions`.

## Development

The current `.env` defaults to production same-chain/cross-chain aggregator,
KS Setting and KD APIs. Deployment environment variables can override these.
See `apps/kyberswap-interface/README.md` for setup; run checks from the repository root:

```sh
pnpm --filter @kyberswap/interface exec vitest run src/pages/Swap src/components/SwapForm src/components/TokenSelectorModal
pnpm --filter @kyberswap/interface exec tsc --noEmit
```

Shared changes also need affected KyberCross/PartnerSwap tests. Unit tests do not
verify browser layout, live provider responses or wallet E2E flows.
