import { useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { isSwapLikePath } from 'utils/routes'

const usePageLocation = () => {
  const location = useLocation()
  const isPartnerSwap = location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const isUserSwap = location.pathname.startsWith(APP_PATHS.USER_SWAP)
  const isSwapPage =
    isSwapLikePath(location.pathname) ||
    isPartnerSwap ||
    isUserSwap ||
    location.pathname.startsWith(APP_PATHS.LIMIT) ||
    location.pathname.startsWith(APP_PATHS.CROSS_CHAIN)

  return {
    pathname: location.pathname,
    isEmbeddedSwap: isPartnerSwap || isUserSwap,
    isSwapPage,
    isCrossChain: location.pathname.startsWith(APP_PATHS.CROSS_CHAIN),
  }
}

export default usePageLocation
