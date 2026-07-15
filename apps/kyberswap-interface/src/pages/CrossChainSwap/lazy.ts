import { lazy } from 'react'

// Lazy boundaries for the cross-chain swap surface (LiFi / NEAR / Solana / Bitcoin wallet SDKs, ~789KB gz).
// Splitting them out of the SwapV3 / PartnerSwap route chunk keeps /swap and /limit from downloading the
// non-EVM cross-chain code they never render. prefetchCrossChainSwap() warms the same chunk on hover of a
// cross-chain entry point (nav link, tab) so switching in-app resolves the Suspense boundary instantly.
//
// A direct load of /cross-chain still pays one on-demand chunk fetch (the code lives behind the route's own
// SwapV3 chunk); the render sites wrap these in <Suspense> so that fetch shows a loader rather than blocking.
const importPage = () => import('pages/CrossChainSwap')
const importSources = () => import('pages/CrossChainSwap/components/CrossChainSwapSources')
const importQuoteSteps = () => import('pages/CrossChainSwap/components/QuoteSteps')
const importTransactionHistory = () => import('pages/CrossChainSwap/components/TransactionHistory')

export const CrossChainSwap = lazy(importPage)
export const CrossChainSwapSources = lazy(() => importSources().then(m => ({ default: m.CrossChainSwapSources })))
export const QuoteSteps = lazy(importQuoteSteps)
export const TransactionHistory = lazy(() => importTransactionHistory().then(m => ({ default: m.TransactionHistory })))

export const prefetchCrossChainSwap = () => {
  importPage()
  importSources()
  importQuoteSteps()
  importTransactionHistory()
}
