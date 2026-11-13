import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { ReactNode } from 'react'

import { SingleChainSwapProvider } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import type { EvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

/** Connects pair data to balances, preferences and permit state for the single-chain form.
 * Token resolution/loading stays with the pair owner, rather than being inferred from missing balances. */
type SingleChainSwapFormProviderProps = {
  evmRecipient?: EvmRecipient
  enabled?: boolean
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  children: ReactNode
}

export const SingleChainSwapFormProvider = ({
  enabled = true,
  evmRecipient,
  chainId,
  currencyIn,
  currencyOut,
  children,
}: SingleChainSwapFormProviderProps) => {
  const balanceIn = useCurrencyBalance(currencyIn, currencyIn?.chainId)
  const balanceOut = useCurrencyBalance(currencyOut, currencyOut?.chainId)

  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()

  return (
    <SingleChainSwapProvider
      enabled={enabled}
      evmRecipient={evmRecipient}
      currencyIn={enabled ? currencyIn : undefined}
      currencyOut={enabled ? currencyOut : undefined}
      balanceIn={balanceIn}
      balanceOut={balanceOut}
      isDegenMode={isDegenMode}
      slippage={slippage}
      transactionTimeout={ttl}
      customChainId={chainId}
    >
      {children}
    </SingleChainSwapProvider>
  )
}
