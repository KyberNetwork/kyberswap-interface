import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const whiteListDomains = [/https:\/\/(.+?\.)?kyberswap\.com$/, /https:\/\/(.+)\.kyberengineering\.io$/]

type Options = { _dangerousSkipCheckWhitelist?: boolean; allowRelativePath?: boolean }
export const validateRedirectURL = (
  url: string | undefined,
  { _dangerousSkipCheckWhitelist = false, allowRelativePath = false }: Options = {},
) => {
  try {
    if (!url || url.endsWith('.js')) throw new Error()
    const newUrl = allowRelativePath && url.startsWith('/') ? new URL(`${window.location.origin}${url}`) : new URL(url)
    if (
      newUrl.pathname.endsWith('.js') ||
      !['https:', 'http:'].includes(newUrl.protocol) ||
      (!_dangerousSkipCheckWhitelist && !whiteListDomains.some(regex => newUrl.origin.match(regex)))
    ) {
      throw new Error()
    }
    return url
  } catch (error) {
    return ''
  }
}

export const navigateToUrl = (url: string | undefined, options?: Options) => {
  const urlFormatted = validateRedirectURL(url, options)
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
      if (!validateRedirectURL(actionURL, { _dangerousSkipCheckWhitelist: true })) return
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
