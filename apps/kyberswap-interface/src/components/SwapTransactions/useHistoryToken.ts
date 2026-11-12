import { useHistoryTokens } from 'components/SwapTransactions/useHistoryTokens'
import type { Chain, Currency } from 'types/crossChain'

export const useHistoryToken = (token: Currency | string, chain: Chain): Currency | string =>
  useHistoryTokens([{ chain, token }]).resolve(token, chain)
