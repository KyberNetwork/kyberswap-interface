import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useUpdateSlippageInStableCoinSwap from 'pages/SwapV3/useUpdateSlippageInStableCoinSwap'
import { useAppSelector } from 'state/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers } from 'state/swap/hooks'
import { useDegenModeManager, usePermitData, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { DetailedRouteSummary } from 'types/route'

import useResetCurrenciesOnRemoveImportedTokens from './useResetCurrenciesOnRemoveImportedTokens'

type Props = {
  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>
  goToSettingsView: () => void
  onSelectSuggestedPair: (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => void
  hidden: boolean
}
const PopulatedSwapForm: React.FC<Props> = ({
  routeSummary,
  setRouteSummary,
  goToSettingsView,
  hidden,
  onSelectSuggestedPair,
}) => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const isSelectTokenManually = useAppSelector(state => state.swap.isSelectTokenManually)
  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )
  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.wrapped.address)

  const { onCurrencySelection, onResetSelectCurrency } = useSwapActionHandlers()

  useUpdateSlippageInStableCoinSwap()

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectTokenManually)
  useResetCurrenciesOnRemoveImportedTokens(currencyIn, currencyOut, onResetSelectCurrency)

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      onCurrencySelection(Field.INPUT, c)
    },
    [onCurrencySelection],
  )

  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      onCurrencySelection(Field.OUTPUT, c)
    },
    [onCurrencySelection],
  )

  const props: SwapFormProps = {
    hidden,
    routeSummary,
    setRouteSummary,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isDegenMode,
    slippage,
    transactionTimeout: ttl,
    permit: permitData?.rawSignature,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    goToSettingsView,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
