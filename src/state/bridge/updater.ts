import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef } from 'react'
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

const TIMEOUT = 'TIMEOUT'
function timeout() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TIMEOUT)
    }, 1000 * 3)
  })
}

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()
  const [{ tokenInfoIn, chainIdOut }, setBridgeState] = useBridgeState()
  const { pathname } = useLocation()
  const curChainId = useRef(chainId)
  curChainId.current = chainId

  const formatAndSaveToken = useCallback(
    (tokens: any, chainIdRequest: ChainId) => {
      let native: WrappedTokenInfo | undefined
      if (curChainId.current !== chainIdRequest || !chainIdRequest) return // prevent api 1 call first but finished later
      const result: WrappedTokenInfo[] = []
      Object.keys(tokens).forEach(key => {
        const token = { ...tokens[key] } as MultiChainTokenInfo
        const { address, logoUrl, name, decimals, symbol } = token
        if (!isAddress(address)) {
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
      setBridgeState({ listTokenIn: result, tokenIn: native || result[0], loadingToken: false })
    },
    [setBridgeState],
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        setBridgeState({ loadingToken: true })
        const oldVersion = getBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION)
        let version
        try {
          version = await Promise.race([timeout(), fetchTokenVersion()])
        } catch (error) {}

        const isStaleData = oldVersion !== version || !version || version === TIMEOUT
        if (isStaleData && version !== TIMEOUT) {
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
    const destChainInfo = tokenInfoIn?.destChains || {}
    if (!chainIdOut || !tokenInfoIn || !chainId) {
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
          chainId: chainIdOut,
          decimals,
          symbol,
          name,
          address,
          logoURI: tokenInfoIn.logoUrl,
          multichainInfo: token,
        }),
      )
    })
    setBridgeState({ listTokenOut })
  }, [chainIdOut, tokenInfoIn, chainId, setBridgeState])

  return null
}
