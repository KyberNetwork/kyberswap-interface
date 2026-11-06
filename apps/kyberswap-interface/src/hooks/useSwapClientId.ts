import { useSearchParams } from 'react-router-dom'

import { useAppSelector } from 'state/hooks'
import { SAFE_APP_CLIENT_ID, isInSafeApp } from 'utils/safeApp'

export default function useSwapClientId() {
  const [searchParams] = useSearchParams()
  const routerV3Test = useAppSelector(state => state.swap.routerV3Test)
  if (isInSafeApp) return SAFE_APP_CLIENT_ID
  return routerV3Test ? 'router-v3-sim-test' : searchParams.get('clientId') || 'kyberswap'
}
