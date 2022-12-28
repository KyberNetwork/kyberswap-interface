import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useAppSelector } from 'state/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { RouteSummary } from 'types/metaAggregator'

import useResetCurrenciesOnRemoveImportedTokens from './useResetCurrenciesOnRemoveImportedTokens'

const useUpdateSlippageInStableCoinSwap = (currencyIn?: Currency, currencyOut?: Currency) => {
  const { chainId } = useActiveWeb3React()
  const [slippage, setSlippage] = useUserSlippageTolerance()
  const isStableCoinSwap =
    chainId &&
    currencyIn &&
    currencyOut &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyIn.wrapped.address) &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyOut.wrapped.address)
  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage
  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setSlippage(50)
    }
  }, [isStableCoinSwap, setSlippage])
}

type Props = {
  routeSummary: RouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<RouteSummary | undefined>>
  goToSettingsView: () => void
}
const PopulatedSwapForm: React.FC<Props> = ({ routeSummary, setRouteSummary, goToSettingsView }) => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const isSelectCurrencyManually = useAppSelector(state => state.swap.isSelectTokenManually)
  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )
  const [ttl] = useUserTransactionTTL()
  const [isAdvancedMode] = useExpertModeManager()
  const [slippage] = useUserSlippageTolerance()

  const { feeConfig } = useSwapState()
  const { onUserInput, onCurrencySelection, onResetSelectCurrency } = useSwapActionHandlers()

  useUpdateSlippageInStableCoinSwap()

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) {
        onUserInput(Field.INPUT, amount)
      }
    },
    [onCurrencySelection, onUserInput],
  )

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually)
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
    routeSummary,
    setRouteSummary,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isAdvancedMode,
    slippage,
    feeConfig,
    transactionTimeout: ttl,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    goToSettingsView,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
