import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'viem'

import { isNativeAsset } from 'utils/nativeErc20'

// Native-token units, shared by Swap/Wrap, Cross-chain swap and Pool Detail Add Liquidity.
// Missing chains have no reservation.
const NATIVE_GAS_RESERVE: Partial<Record<ChainId, string | null>> = {
  [ChainId.MAINNET]: '0.005',
  [ChainId.ARBITRUM]: '0.0002',
  [ChainId.BASE]: '0.0002',
  [ChainId.OPTIMISM]: '0.0002',
  [ChainId.UNICHAIN]: '0.0002',
  [ChainId.LINEA]: '0.0002',
  [ChainId.MEGAETH]: '0.0002',
  [ChainId.ROBINHOOD]: '0.0004',
  [ChainId.MATIC]: '0.2',
  [ChainId.BSCMAINNET]: '0.002',
  [ChainId.AVAXMAINNET]: '0.01',
  [ChainId.SONIC]: '0.04',
  [ChainId.BERA]: '0.01',
  [ChainId.RONIN]: '0.04',
  [ChainId.RISE]: '0.0002',
  [ChainId.HYPEREVM]: '0.01',
  [ChainId.MONAD]: '1',
  [ChainId.PLASMA]: '1',
  [ChainId.ETHERLINK]: '0.5',
  [ChainId.ARC]: '0.5',
}

export function getGasReservation(balance: CurrencyAmount<Currency> | undefined) {
  if (!balance || !isNativeAsset(balance.currency)) return undefined

  const reserve = NATIVE_GAS_RESERVE[balance.currency.chainId]
  if (reserve == null) return undefined

  const remaining = BigInt(balance.quotient.toString()) - parseUnits(reserve, balance.currency.decimals)
  if (remaining < 0n) return undefined

  return {
    maxAmount: CurrencyAmount.fromRawAmount(balance.currency, remaining.toString()),
  }
}
