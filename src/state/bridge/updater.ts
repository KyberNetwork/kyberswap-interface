import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { AppPaths } from 'pages/App'
import {
  BridgeLocalStorageKeys,
  fetchTokenVersion,
  getBridgeLocalstorage,
  getChainlist,
  getTokenlist,
  setBridgeLocalstorage,
} from 'pages/Bridge/helpers'
import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { isAddress } from 'utils'
import { isTokenNative } from 'utils/tokenInfo'

import { useActiveWeb3React } from '../../hooks'
import { useBridgeState } from './hooks'

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()
  const [{ tokenIn, chainIdOut }, setBridgeState] = useBridgeState()
  const { pathname } = useLocation()
  const formatAndSaveToken = useCallback(
    (tokens: any, chainIdRequest: ChainId) => {
      let native: WrappedTokenInfo | undefined
      if (chainId !== chainIdRequest || !chainIdRequest) return // prevent api 1 call first but finished later
      const result: WrappedTokenInfo[] = []
      Object.keys(tokens).forEach(key => {
        const token = { ...tokens[key] } as MultiChainTokenInfo
        const { address, logoUrl, destChains, name, decimals, symbol } = token

        if (!destChains) return
        // todo test unlimit pool
        // todo move this
        // todo emt sao chưa format pool
        // todo back sang trang khác quay lại đang delay 1 chút mới show token
        // todo tooltip disabled network select
        Object.keys(destChains).forEach(chain => {
          Object.keys(destChains[chain]).forEach(address => {
            const info = destChains[chain][address]
            if (!isAddress(info.address)) {
              delete destChains[chain][address]
            }
          })
          if (!Object.keys(destChains[chain]).length) {
            delete destChains[chain]
          }
        })
        //

        if (!destChains || Object.keys(destChains).length === 0 || !isAddress(address)) {
          return
        }

        token.key = key
        token.chainId = chainIdRequest
        const wrappedToken = new WrappedTokenInfo({
          chainId: chainIdRequest,
          decimals,
          symbol,
          name,
          address,
          logoURI: logoUrl,
          multichainInfo: token,
        })
        result.push(wrappedToken)
        if (isTokenNative(wrappedToken, chainIdRequest)) {
          native = wrappedToken
        }
      })
      setBridgeState({ listTokenIn: result, tokenIn: native || result[0] })
    },
    [setBridgeState, chainId],
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const oldVersion = getBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION)
        let version
        try {
          version = await fetchTokenVersion()
        } catch (error) {}

        const isStaleData = oldVersion !== version || !version
        if (isStaleData) {
          setBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION, version)
        }

        const data = await Promise.allSettled([
          getChainlist(isStaleData),
          chainId ? getTokenlist(chainId, isStaleData) : Promise.reject(),
        ])
        if (data[0].status === 'fulfilled') {
          const listChainIn = data[0].value
          setBridgeState({ listChainIn })
        }
        if (data[1].status === 'fulfilled' && chainId) {
          const tokens = data[1].value
          formatAndSaveToken(tokens, chainId)
        }
      } catch (error) {
        console.error(error)
      }
    }

    if (pathname.startsWith(AppPaths.BRIDGE) && chainId) {
      fetchData()
    }
  }, [chainId, setBridgeState, formatAndSaveToken, pathname])

  useEffect(() => {
    const destChainInfo = tokenIn?.destChains || {}
    if (!chainIdOut || !tokenIn || !chainId) {
      setBridgeState({ listTokenOut: [] })
      return
    }
    const map = chainIdOut ? destChainInfo[chainIdOut] ?? {} : {}
    const listTokenOut: WrappedTokenInfo[] = []
    Object.keys(map).forEach(hash => {
      const token = { ...map[hash] }
      token.key = hash
      const { decimals, name, address, symbol } = token as MultiChainTokenInfo
      if (!isAddress(address)) return
      listTokenOut.push(
        new WrappedTokenInfo({
          chainId,
          decimals,
          symbol,
          name,
          address,
          logoURI: tokenIn.logoUrl,
          multichainInfo: token,
        }),
      )
    })
    setBridgeState({ listTokenOut })
  }, [chainIdOut, tokenIn, chainId, setBridgeState])

  return null
}
