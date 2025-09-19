import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInterval } from 'react-use'

import { PAIR_CATEGORY } from 'constants/index'
import { AppDispatch, AppState } from 'state/index'
import { usePairCategory } from 'state/swap/hooks'

import { updatePoolDegenMode, updateUserDegenMode } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const cat = usePairCategory()

  const isStablePairSwap = cat === PAIR_CATEGORY.STABLE

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

  const autoDisableSwapDegenMode = useCallback(() => {
    if (swapDegenMode && swapDegenModeAutoDisableTimestamp <= Date.now()) {
      dispatch(updateUserDegenMode({ userDegenMode: false, isStablePairSwap }))
    }
  }, [swapDegenMode, dispatch, isStablePairSwap, swapDegenModeAutoDisableTimestamp])

  const autoDisablePoolDegenMode = useCallback(() => {
    if (poolDegenMode && poolDegenModeAutoDisableTimestamp <= Date.now()) {
      dispatch(updatePoolDegenMode({ poolDegenMode: false, isStablePairSwap }))
    }
  }, [poolDegenMode, dispatch, isStablePairSwap, poolDegenModeAutoDisableTimestamp])

  useInterval(autoDisableSwapDegenMode, 1_000)
  useInterval(autoDisablePoolDegenMode, 1_000)

  return null
}
