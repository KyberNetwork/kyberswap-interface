import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'
import { AppDispatch, AppState } from 'state/index'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

import {
  pushOrderNeedCreated as pushOrderNeedCreatedAction,
  removeOrderNeedCreated as removeOrderNeedCreatedAction,
  setOrderEditing as setOrderEditingAction,
} from './actions'
import { LimitState } from './reducer'

export function useLimitState(): LimitState & {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
} {
  // use swap state to sync data between 2 tabs LO/swap
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const { typedValue: inputAmount } = useSwapState()

  const state = useSelector((state: AppState) => state.limit)
  return { ...state, currencyIn, currencyOut, inputAmount }
}

export function useLimitActionHandlers() {
  const dispatch = useDispatch<AppDispatch>()
  const { onSwitchTokensV2, onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const setInputValue = useCallback(
    (inputAmount: string) => {
      onUserInput(Field.INPUT, inputAmount)
    },
    [onUserInput],
  )

  const setCurrencyIn = useCallback(
    (currencyIn: Currency | undefined) => {
      currencyIn && onCurrencySelection(Field.INPUT, currencyIn)
    },
    [onCurrencySelection],
  )

  const setCurrencyOut = useCallback(
    (currencyOut: Currency | undefined) => {
      currencyOut && onCurrencySelection(Field.OUTPUT, currencyOut)
    },
    [onCurrencySelection],
  )

  const pushOrderNeedCreated = useCallback(
    (order: CreateOrderParam) => {
      dispatch(pushOrderNeedCreatedAction(order))
    },
    [dispatch],
  )

  const removeOrderNeedCreated = useCallback(
    (orderId: number) => {
      dispatch(removeOrderNeedCreatedAction(orderId))
    },
    [dispatch],
  )

  const setOrderEditing = useCallback(
    (order: CreateOrderParam) => {
      dispatch(setOrderEditingAction(order))
    },
    [dispatch],
  )

  return {
    switchCurrency: onSwitchTokensV2,
    setCurrencyIn,
    setCurrencyOut,
    pushOrderNeedCreated,
    removeOrderNeedCreated,
    setOrderEditing,
    setInputValue,
  }
}
