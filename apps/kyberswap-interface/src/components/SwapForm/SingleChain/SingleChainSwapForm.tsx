import { ChainId, Currency } from '@kyberswap/ks-sdk-core'

import SingleChainSwap from 'components/SwapForm/SingleChain/SingleChainSwap'
import { useActiveWeb3React } from 'hooks'
import type { NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { usePermitData } from 'state/swap/hooks'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { DetailedRouteSummary } from 'types/route'

/** Connects pair data to balances, preferences and permit state for the single-chain form.
 * Token resolution/loading stays with the pair owner, rather than being inferred from missing balances. */
export type SingleChainSwapFormProps = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  isInputCurrencyLoading?: boolean
  isOutputCurrencyLoading?: boolean
  onChangeCurrencyIn: (currency: Currency) => void
  onChangeCurrencyOut: (currency: Currency) => void
  onSelectNonEvmCurrencyIn?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onSelectNonEvmCurrencyOut?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onRouteChange: (route: DetailedRouteSummary | undefined) => void
  onRouteLoadingChange?: (loading: boolean) => void
  hidden: boolean
}

export const SingleChainSwapForm = ({ chainId, currencyIn, currencyOut, ...props }: SingleChainSwapFormProps) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const balanceIn = useCurrencyBalance(currencyIn, currencyIn?.chainId)
  const balanceOut = useCurrencyBalance(currencyOut, currencyOut?.chainId)
  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.chainId === walletChainId ? currencyIn.wrapped.address : undefined)

  return (
    <SingleChainSwap
      {...props}
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
    />
  )
}
