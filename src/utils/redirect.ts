import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getChainIdFromSlug } from 'utils/string'

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

export const navigateToSwapPage = ({ address, chain }: { address?: string; chain?: string | number }) => {
  if (!address || !chain) return
  const chainId: ChainId | undefined = !isNaN(+chain) ? +chain : getChainIdFromSlug(chain as string)
  if (!chainId) return
  window.open(
    window.location.origin +
      `${APP_PATHS.SWAP}/${NETWORKS_INFO[chainId].route}?inputCurrency=${WETH[chainId].address}&outputCurrency=${address}`,
    '_blank',
  )
}
