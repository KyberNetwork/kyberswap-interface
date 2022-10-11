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

import { useActiveWeb3React } from '../../hooks'
import { useBridgeState } from './hooks'

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()
  const [{ tokenIn, chainIdOut }, setBridgeState] = useBridgeState()
  const { pathname } = useLocation()
  const formatAndSaveToken = useCallback(
    (tokens: any) => {
      const result: WrappedTokenInfo[] = []
      Object.keys(tokens).forEach(key => {
        if (!chainId) return
        const { address, logoUrl, destChains, name, decimals, symbol } = tokens[key] as MultiChainTokenInfo
        if (!destChains || Object.keys(destChains).length === 0) {
          delete tokens[key]
          return
        }
        tokens[key].key = key
        tokens[key].chainId = chainId
        result.push(
          new WrappedTokenInfo({
            chainId,
            decimals,
            symbol,
            name,
            address,
            logoURI: logoUrl,
            multichainInfo: tokens[key],
          }),
        )
      })
      setBridgeState({ listTokenIn: result, tokenIn: result[0] })
    },
    [chainId, setBridgeState],
  )

  // todo prevent call many time
  useEffect(() => {
    const fetchData = async () => {
      try {
        const oldVersion = getBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION)
        const version = await fetchTokenVersion()
        const isStaleData = oldVersion !== version
        if (isStaleData) {
          setBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION, version)
        }
        getChainlist(isStaleData)
          .then(listChainIn => setBridgeState({ listChainIn }))
          .catch(console.error)
        if (chainId) {
          getTokenlist(chainId, isStaleData)
            .then(tokens => formatAndSaveToken(tokens))
            .catch(console.error)
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
