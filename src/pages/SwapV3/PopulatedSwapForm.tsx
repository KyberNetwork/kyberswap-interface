import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useAppSelector } from 'state/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

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

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const isSelectCurrencyManually = useAppSelector(state => state.swap.isSelectTokenManually)
  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const [isAdvancedMode] = useExpertModeManager()
  const [allowedSlippage] = useUserSlippageTolerance()

  const { recipient, typedValue } = useSwapState()
  const { onSwitchTokensV2, onUserInput, onCurrencySelection, onChangeRecipient, onResetSelectCurrency } =
    useSwapActionHandlers()

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

  const props: SwapFormProps = {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    typedValue,
    isAdvancedMode,
    allowedSlippage,
    recipient,

    onReverseTokenSelection: onSwitchTokensV2,
    onUserInput,
    onCurrencySelection,
    onResetSelectCurrency,
    onChangeRecipient,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
