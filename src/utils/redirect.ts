import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const whiteListDomains = [/https:\/\/(.+?\.)?kyberswap\.com$/, /https:\/\/(.+)\.kyberengineering\.io$/]
export const validateRedirectURL = (url: string | undefined, whitelistKyberSwap = true) => {
  try {
    if (!url) throw new Error()
    const newUrl = new URL(url) // valid url
    if (
      url.endsWith('.js') ||
      newUrl.pathname.endsWith('.js') ||
      !['https:', 'http:'].includes(newUrl.protocol) ||
      (whitelistKyberSwap && !whiteListDomains.some(regex => newUrl.origin.match(regex)))
    ) {
      throw new Error()
    }
    return url
  } catch (error) {
    return ''
  }
}

export const navigateToUrl = (url: string | undefined, whitelistKyberSwap = true) => {
  const urlFormatted = validateRedirectURL(url, whitelistKyberSwap)
  if (urlFormatted) window.location.href = urlFormatted
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
      if (!validateRedirectURL(actionURL, false)) return
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
