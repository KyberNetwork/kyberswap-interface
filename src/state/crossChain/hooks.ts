import { RouteResponse } from '@0xsquid/sdk'
import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { AppDispatch, AppState } from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import {
  BridgeStateParams,
  BridgeStatePoolParams,
  CrossChainStateParams,
  resetBridgeState as resetBridgeStateAction,
  selectCurrencyCrossChain,
  selectDestChainCrossChain,
  setBridgePoolInfo as setBridgePoolInfoAction,
  setBridgeState,
  setCrossChainState,
  setInputAmountCrossChain,
  setRoute,
} from './actions'
import { BridgeState, SwapCrossChainState } from './reducer'

export function useBridgeState(): [BridgeState, (value: BridgeStateParams) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const bridge = useSelector((state: AppState) => state.crossChain.bridge)
  const setState = useCallback((data: BridgeStateParams) => dispatch(setBridgeState(data)), [dispatch])
  return [bridge, setState]
}

export function useBridgeStateHandler() {
  const dispatch = useDispatch<AppDispatch>()

  const resetBridgeState = useCallback(() => dispatch(resetBridgeStateAction()), [dispatch])
  const setBridgePoolInfo = useCallback(
    (data: BridgeStatePoolParams) => dispatch(setBridgePoolInfoAction(data)),
    [dispatch],
  )

  const setBridgeState = useBridgeState()[1]
  return { resetBridgeState, setBridgeState, setBridgePoolInfo }
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
        time: '~3-30 mins',
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

export function useBridgeOutputValue(inputBridgeValue: string) {
  const [{ tokenInfoOut }] = useBridgeState()
  return useMemo(() => {
    return calcReceiveValueAndFee(inputBridgeValue, tokenInfoOut)
  }, [inputBridgeValue, tokenInfoOut])
}

export function useCrossChainState(): [
  SwapCrossChainState & { listChainOut: ChainId[]; listTokenOut: WrappedTokenInfo[]; listTokenIn: WrappedTokenInfo[] },
  (value: CrossChainStateParams) => void,
] {
  const dispatch = useDispatch<AppDispatch>()
  const crossChain = useSelector((state: AppState) => state.crossChain.crossChain)
  const { chains, tokens, chainIdOut } = crossChain
  const { chainId } = useActiveWeb3React()
  const setState = useCallback((data: CrossChainStateParams) => dispatch(setCrossChainState(data)), [dispatch])

  const listChainOut = useMemo(() => chains.filter(e => e !== chainId), [chains, chainId])
  const listTokenOut = useMemo(() => tokens.filter(e => e.chainId === chainIdOut), [tokens, chainIdOut])
  const listTokenIn = useMemo(() => tokens.filter(e => e.chainId === chainId), [tokens, chainId])

  return [{ ...crossChain, listChainOut, listTokenOut, listTokenIn }, setState]
}

export function useCrossChainHandlers() {
  const dispatch = useDispatch<AppDispatch>()

  const selectCurrencyIn = useCallback(
    (currencyIn: NativeCurrency | WrappedTokenInfo) => {
      dispatch(selectCurrencyCrossChain({ currencyIn }))
    },
    [dispatch],
  )
  const selectCurrencyOut = useCallback(
    (currencyOut: NativeCurrency | WrappedTokenInfo) => {
      dispatch(selectCurrencyCrossChain({ currencyOut }))
    },
    [dispatch],
  )

  const selectDestChain = useCallback(
    (chainId: ChainId | undefined) => dispatch(selectDestChainCrossChain(chainId)),
    [dispatch],
  )

  const setTradeRoute = useCallback((data: RouteResponse | undefined) => dispatch(setRoute(data)), [dispatch])
  const setInputAmount = useCallback((data: string) => dispatch(setInputAmountCrossChain(data)), [dispatch])

  return { selectDestChain, setTradeRoute, setInputAmount, selectCurrencyIn, selectCurrencyOut }
}
