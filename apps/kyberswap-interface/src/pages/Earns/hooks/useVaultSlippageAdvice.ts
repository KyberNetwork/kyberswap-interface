import { useCheckPairQuery } from 'services/tokenCatalog'

import { PAIR_CATEGORY } from 'constants/trade'
import { SlippageNotice, getPairSlippageNotice, getSlippageNotice } from 'utils/slippage'

/**
 * What the swap form opens on for each kind of pair, in basis points. Deliberately partial: the
 * category endpoint answers with names the enum does not carry — `commonPair` among them — and the
 * swap form treats anything it does not recognise as `SWAP_FALLBACK_BPS`.
 */
const DEFAULT_BY_CATEGORY: Partial<Record<PAIR_CATEGORY, number>> = {
  [PAIR_CATEGORY.STABLE]: 1,
  [PAIR_CATEGORY.CORRELATED]: 5,
  [PAIR_CATEGORY.HIGH_VOLATILITY]: 150,
  [PAIR_CATEGORY.EXOTIC]: 50,
}

/** Where the swap form lands on a pair it has no named kind for. */
const SWAP_FALLBACK_BPS = 50

/** What the zap flows open on, and what stands in until a pair's category comes back. */
export const DEFAULT_VAULT_SLIPPAGE_BPS = 10

/**
 * Which model judges a vault's slippage.
 *
 * One token in is a trade between two tokens, so it is read the way the swap form reads one: the
 * pair's category sets both the opening value and the bands a warning comes from. Several tokens in
 * is not a pair at all, so it falls back to the zap model, where the route's own `suggestedSlippage`
 * is the only reference on offer.
 *
 * Takes the tokens the form holds rather than the amounts typed against them, so the opening value
 * does not move while someone fills the fields in.
 */
export const useVaultSlippageAdvice = ({
  chainId,
  tokensIn,
  tokenOut,
}: {
  chainId?: number
  /** Every token the form spends, whether or not an amount has been typed against it. */
  tokensIn: string[]
  tokenOut?: string
}) => {
  const isSingleToken = tokensIn.length === 1
  const tokenIn = isSingleToken ? tokensIn[0] : undefined

  const { data } = useCheckPairQuery(
    { chainId: chainId as number, tokenIn: tokenIn ?? '', tokenOut: tokenOut ?? '' },
    { skip: !chainId || !tokenIn || !tokenOut },
  )

  const category = data?.data.category

  return {
    isSingleToken,
    category,
    // Until the category lands, the zap default stands in: reading an unresolved pair as the widest
    // kind would open the form at 0.5% and drop it a moment later.
    defaultBps:
      isSingleToken && category ? DEFAULT_BY_CATEGORY[category] ?? SWAP_FALLBACK_BPS : DEFAULT_VAULT_SLIPPAGE_BPS,
  }
}

export type VaultSlippageAdvice = ReturnType<typeof useVaultSlippageAdvice>

/** The note under the control, from whichever model `useVaultSlippageAdvice` picked. */
export const getVaultSlippageNotice = (
  advice: VaultSlippageAdvice,
  slippage: number,
  suggestedSlippage?: number,
): SlippageNotice | null =>
  advice.isSingleToken
    ? getPairSlippageNotice(slippage, advice.category)
    : getSlippageNotice(slippage, suggestedSlippage)
