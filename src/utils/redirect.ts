import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const whiteListDomains = [/https:\/\/(.+?\.)?kyberswap\.com$/, /https:\/\/(.+)\.kyberengineering\.io$/]
export const isValidRedirectURL = (url: string | undefined, whitelistKyberSwap = true) => {
  try {
    if (!url) return false
    const newUrl = new URL(url) // valid url
    if (
      url.endsWith('.js') ||
      newUrl.pathname.endsWith('.js') ||
      (whitelistKyberSwap && !whiteListDomains.some(regex => newUrl.origin.match(regex)))
    ) {
      return false
    }
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:'
  } catch (error) {
    return false
  }
}

export const navigateToUrl = (url: string | undefined, whitelistKyberSwap = true) => {
  if (url && isValidRedirectURL(url, whitelistKyberSwap)) window.location.href = url
}

/**
 * this hook to navigate to specific url
 * detect using window.open or navigate (react-router)
 * check change chain if needed
 */
export const useNavigateToUrl = () => {
  const navigate = useNavigate()
  const { chainId: currentChain } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const redirect = useCallback(
    (actionURL: string) => {
      if (actionURL && actionURL.startsWith('/')) {
        navigate(actionURL)
        return
      }
      const { pathname, host, search } = new URL(actionURL)
      if (!isValidRedirectURL(actionURL, false)) return
      if (window.location.host === host) {
        navigate(`${pathname}${search}`)
      } else {
        window.open(actionURL)
      }
    },
    [navigate],
  )

  return useCallback(
    (actionURL: string, chainId?: ChainId) => {
      try {
        if (!actionURL) return
        if (chainId && chainId !== currentChain) {
          changeNetwork(chainId, () => redirect(actionURL), undefined, true)
        } else {
          redirect(actionURL)
        }
      } catch (error) {}
    },
    [changeNetwork, currentChain, redirect],
  )
}
