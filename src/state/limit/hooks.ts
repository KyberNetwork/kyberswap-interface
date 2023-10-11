import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import useDefaultsTokenFromURLSearch from 'hooks/useDefaultsTokenFromURLSearch'
import { AppDispatch, AppState } from 'state/index'

import {
  pushOrderNeedCreated as pushOrderNeedCreatedAction,
  removeOrderNeedCreated as removeOrderNeedCreatedAction,
  setInputAmount,
  setLimitCurrency,
  setOrderEditing as setOrderEditingAction,
} from './actions'
import { LimitState } from './reducer'

export function useLimitState(): LimitState {
  return useSelector((state: AppState) => state.limit)
}

export function useLimitActionHandlers() {
  const dispatch = useDispatch<AppDispatch>()
  const { currencyIn, currencyOut } = useLimitState()
  const { inputCurrency, outputCurrency } = useDefaultsTokenFromURLSearch(currencyIn, currencyOut, APP_PATHS.LIMIT)

  const setInputValue = useCallback(
    (inputAmount: string) => {
      dispatch(setInputAmount(inputAmount))
    },
    [dispatch],
  )

  const resetState = useCallback(() => {
    setInputValue('')
  }, [setInputValue])

  const onSelectPair = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined, inputAmount?: string) => {
      dispatch(
        setLimitCurrency({
          currencyIn,
          currencyOut,
        }),
      )
      if (inputAmount !== undefined) {
        setInputValue(inputAmount)
      }
    },
    [dispatch, setInputValue],
  )

  useEffect(() => {
    if (
      (inputCurrency && !currencyIn?.equals(inputCurrency)) ||
      (outputCurrency && !currencyOut?.equals(outputCurrency))
    ) {
      onSelectPair(inputCurrency ?? undefined, outputCurrency ?? undefined)
    }
  }, [onSelectPair, inputCurrency, outputCurrency, currencyIn, currencyOut])

  const setCurrencyIn = useCallback(
    (currencyIn: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyOut, onSelectPair],
  )

  const setCurrencyOut = useCallback(
    (currencyOut: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyIn, onSelectPair],
  )

  const switchCurrency = useCallback(() => {
    onSelectPair(currencyOut, currencyIn)
  }, [onSelectPair, currencyOut, currencyIn])

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
    switchCurrency,
    setCurrencyIn,
    setCurrencyOut,
    onSelectPair,
    pushOrderNeedCreated,
    removeOrderNeedCreated,
    setOrderEditing,
    resetState,
  }
}
