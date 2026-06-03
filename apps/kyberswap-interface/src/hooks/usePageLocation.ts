import { useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'

const SWAP_PAGE_URLS = [
  APP_PATHS.SWAP,
  APP_PATHS.PARTNER_SWAP,
  APP_PATHS.USER_SWAP,
  APP_PATHS.LIMIT,
  APP_PATHS.CROSS_CHAIN,
]

const usePageLocation = () => {
  const location = useLocation()
  const isPartnerSwap = location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const isUserSwap = location.pathname.startsWith(APP_PATHS.USER_SWAP)
  const isSwapPage = SWAP_PAGE_URLS.some(url => location.pathname.startsWith(url))

  return {
    pathname: location.pathname,
    isPartnerSwap,
    isUserSwap,
    isEmbeddedSwap: isPartnerSwap,
    isSwapPage,
    isCrossChain: location.pathname.startsWith(APP_PATHS.CROSS_CHAIN),
  }
}

export default usePageLocation
