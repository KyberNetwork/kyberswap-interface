import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInterval } from 'react-use'

import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { AppDispatch, AppState } from 'state/index'
import { useCheckStablePairSwap } from 'state/swap/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

import { updateUserDegenMode } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const degenMode = useSelector<AppState, AppState['user']['userDegenMode']>(state => state.user.userDegenMode)
  const userDegenModeAutoDisableTimestamp = useSelector<
    AppState,
    AppState['user']['userDegenModeAutoDisableTimestamp']
  >(state => state.user.userDegenModeAutoDisableTimestamp)
  const isStablePairSwap = useCheckStablePairSwap()
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const autoDisableDegenMode = useCallback(() => {
    if (degenMode && userDegenModeAutoDisableTimestamp <= Date.now()) {
      dispatch(updateUserDegenMode({ userDegenMode: false, isStablePairSwap }))
      if (rawSlippage > MAX_NORMAL_SLIPPAGE_IN_BIPS) {
        if (isStablePairSwap) setRawSlippage(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
        else setRawSlippage(DEFAULT_SLIPPAGE)
      }
    }
  }, [degenMode, dispatch, isStablePairSwap, rawSlippage, setRawSlippage, userDegenModeAutoDisableTimestamp])

  useInterval(autoDisableDegenMode, 1_000)

  return null
}
