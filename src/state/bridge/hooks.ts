import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { AppDispatch, AppState } from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { BridgeStateParams, resetBridgeState, setBridgeState } from './actions'

export function useBridgeState(): [
  {
    tokenIn: MultiChainTokenInfo | undefined
    tokenOut: MultiChainTokenInfo | undefined
    currencyIn: WrappedTokenInfo | undefined
    currencyOut: WrappedTokenInfo | undefined
    chainIdOut: ChainId | undefined
    listChainIn: ChainId[]
    listTokenIn: WrappedTokenInfo[]
    listTokenOut: WrappedTokenInfo[]
  },
  (value: BridgeStateParams) => void,
] {
  const dispatch = useDispatch<AppDispatch>()
  const bridge = useSelector((state: AppState) => state.bridge)
  const setState = useCallback((data: BridgeStateParams) => dispatch(setBridgeState(data)), [dispatch])
  return [
    {
      ...bridge,
      tokenIn: bridge?.tokenIn?.multichainInfo,
      tokenOut: bridge?.tokenOut?.multichainInfo,
      currencyIn: bridge?.tokenIn,
      currencyOut: bridge?.tokenOut,
    },
    setState,
  ]
}

export function useBridgeStateHandler() {
  const dispatch = useDispatch<AppDispatch>()
  const resetState = useCallback(() => dispatch(resetBridgeState()), [dispatch])
  const setBridgeState = useBridgeState()[1]
  return { resetBridgeState: resetState, setBridgeState }
}

export type OutputBridgeInfo = {
  fee: string | number
  outputAmount: string | number
  time: string
  inputAmount: string
}
function calcReceiveValueAndFee(inputBridgeValue: string, tokenOut: MultiChainTokenInfo | undefined): OutputBridgeInfo {
  const inputAmount = Number(inputBridgeValue)
  if (inputAmount && tokenOut) {
    const SwapFeeRatePerMillion = Number(tokenOut.SwapFeeRatePerMillion)
    const MaximumSwapFee = Number(tokenOut.MaximumSwapFee)
    const MinimumSwapFee = Number(tokenOut.MinimumSwapFee)
    const BaseFeePercent = Number(tokenOut.BaseFeePercent)
    const minFee = BaseFeePercent ? (MinimumSwapFee / (100 + BaseFeePercent)) * 100 : MinimumSwapFee
    const baseFee = BaseFeePercent ? (minFee * BaseFeePercent) / 100 : 0

    let fee = (inputAmount * SwapFeeRatePerMillion) / 100 // SwapFeeRatePerMillion: 0 or 0.1
    if (fee < minFee) {
      fee = minFee
    } else if (fee > MaximumSwapFee) {
      fee = MaximumSwapFee
    }
    const value = inputAmount - fee - baseFee
    if (value > 0) {
      return {
        fee,
        outputAmount: value,
        time: '3-30 min',
        inputAmount: inputBridgeValue,
      }
    }
  }
  return {
    fee: '',
    outputAmount: '',
    time: '--',
    inputAmount: inputBridgeValue,
  }
}

export function useOutputValue(inputBridgeValue: string) {
  const [{ tokenOut }] = useBridgeState()
  return useMemo(() => {
    return calcReceiveValueAndFee(inputBridgeValue, tokenOut)
  }, [inputBridgeValue, tokenOut])
}
