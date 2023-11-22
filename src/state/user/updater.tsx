import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInterval } from 'react-use'

import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { AppDispatch, AppState } from 'state/index'
import { useCheckStablePairSwap } from 'state/swap/hooks'
import { usePoolSlippageTolerance, useSwapSlippageTolerance } from 'state/user/hooks'

import { updatePoolDegenMode, updateUserDegenMode } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const isStablePairSwap = useCheckStablePairSwap()

  const swapDegenMode = useSelector<AppState, AppState['user']['userDegenMode']>(state => state.user.userDegenMode)
  const swapDegenModeAutoDisableTimestamp = useSelector<
    AppState,
    AppState['user']['userDegenModeAutoDisableTimestamp']
  >(state => state.user.userDegenModeAutoDisableTimestamp)

  const poolDegenMode = useSelector<AppState, AppState['user']['poolDegenMode']>(state => state.user.poolDegenMode)
  const poolDegenModeAutoDisableTimestamp = useSelector<
    AppState,
    AppState['user']['poolDegenModeAutoDisableTimestamp']
  >(state => state.user.poolDegenModeAutoDisableTimestamp)

  const [swapSlippageTolerance, setSwapSlippageTolerance] = useSwapSlippageTolerance()
  const [poolSlippageTolerance, setPoolSlippageTolerance] = usePoolSlippageTolerance()

  const autoDisableSwapDegenMode = useCallback(() => {
    if (swapDegenMode && swapDegenModeAutoDisableTimestamp <= Date.now()) {
      dispatch(updateUserDegenMode({ userDegenMode: false, isStablePairSwap }))
      if (swapSlippageTolerance > MAX_NORMAL_SLIPPAGE_IN_BIPS) {
        if (isStablePairSwap) setSwapSlippageTolerance(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
        else setSwapSlippageTolerance(DEFAULT_SLIPPAGE)
      }
    }
  }, [
    swapDegenMode,
    dispatch,
    isStablePairSwap,
    swapSlippageTolerance,
    setSwapSlippageTolerance,
    swapDegenModeAutoDisableTimestamp,
  ])

  const autoDisablePoolDegenMode = useCallback(() => {
    if (poolDegenMode && poolDegenModeAutoDisableTimestamp <= Date.now()) {
      dispatch(updatePoolDegenMode({ poolDegenMode: false, isStablePairSwap }))
      if (poolSlippageTolerance > MAX_NORMAL_SLIPPAGE_IN_BIPS) {
        if (isStablePairSwap) setPoolSlippageTolerance(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
        else setPoolSlippageTolerance(DEFAULT_SLIPPAGE)
      }
    }
  }, [
    poolDegenMode,
    dispatch,
    isStablePairSwap,
    poolSlippageTolerance,
    setPoolSlippageTolerance,
    poolDegenModeAutoDisableTimestamp,
  ])

  useInterval(autoDisableSwapDegenMode, 1_000)
  useInterval(autoDisablePoolDegenMode, 1_000)

  return null
}
