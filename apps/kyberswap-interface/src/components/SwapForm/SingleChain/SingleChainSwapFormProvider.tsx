import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { ReactNode } from 'react'

import { SingleChainSwapProvider } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import { useActiveWeb3React } from 'hooks'
import { usePermitData } from 'state/swap/hooks'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

/** Connects pair data to balances, preferences and permit state for the single-chain form.
 * Token resolution/loading stays with the pair owner, rather than being inferred from missing balances. */
export type SingleChainSwapFormProviderProps = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  children: ReactNode
}

export const SingleChainSwapFormProvider = ({
  chainId,
  currencyIn,
  currencyOut,
  children,
}: SingleChainSwapFormProviderProps) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const balanceIn = useCurrencyBalance(currencyIn, currencyIn?.chainId)
  const balanceOut = useCurrencyBalance(currencyOut, currencyOut?.chainId)
  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.chainId === walletChainId ? currencyIn.wrapped.address : undefined)

  return (
    <SingleChainSwapProvider
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      balanceIn={balanceIn}
      balanceOut={balanceOut}
      isDegenMode={isDegenMode}
      slippage={slippage}
      transactionTimeout={ttl}
      permit={permitData?.rawSignature}
      customChainId={chainId}
      chainSelectionMode="form"
    >
      {children}
    </SingleChainSwapProvider>
  )
}
