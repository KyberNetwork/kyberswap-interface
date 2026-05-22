import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, AppState } from 'state'

import {
  DustInput,
  DustToken,
  addInputToken,
  removeInputToken,
  replaceInputs,
  resetState,
  setInputAmount,
  setOutputToken,
  setRecipient,
  setSlippage,
} from './actions'

export const useDustLiquidationState = () => useSelector((s: AppState) => s.dustLiquidation)

export const useDustLiquidationActions = () => {
  const dispatch = useDispatch<AppDispatch>()

  const addToken = useCallback((token: DustToken) => dispatch(addInputToken({ token })), [dispatch])
  const removeToken = useCallback((address: string) => dispatch(removeInputToken({ address })), [dispatch])
  const updateAmount = useCallback(
    (address: string, amount: string) => dispatch(setInputAmount({ address, amount })),
    [dispatch],
  )
  const replace = useCallback((inputs: DustInput[]) => dispatch(replaceInputs({ inputs })), [dispatch])
  const updateOutput = useCallback((token: DustToken | null) => dispatch(setOutputToken({ token })), [dispatch])
  const updateSlippage = useCallback((slippage: number) => dispatch(setSlippage({ slippage })), [dispatch])
  const updateRecipient = useCallback((recipient: string | null) => dispatch(setRecipient({ recipient })), [dispatch])
  const reset = useCallback(() => dispatch(resetState()), [dispatch])

  return { addToken, removeToken, updateAmount, replace, updateOutput, updateSlippage, updateRecipient, reset }
}
