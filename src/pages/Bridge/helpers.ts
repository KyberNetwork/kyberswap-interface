import { ChainId } from '@kyberswap/ks-sdk-core'
import axios from 'axios'

import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { isAddress } from 'utils'

import { MultiChainTokenInfo } from './type'

export const BridgeLocalStorageKeys = {
  BRIDGE_INFO: 'bridgeInfo',
  SHOWED_DISCLAIMED: 'showedDisclaimed',
  CHAINS_SUPPORTED: 'chainSupported',
  TOKEN_VERSION: 'tokenVer',
  TOKEN_LIST: 'bridgeTokenList',
}

export const getBridgeLocalstorage = (key: string) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(BridgeLocalStorageKeys.BRIDGE_INFO) || '{}',
  )
  return bridgeInfo?.[key]
}
export const setBridgeLocalstorage = (key: string, value: any) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(BridgeLocalStorageKeys.BRIDGE_INFO) || '{}',
  )
  localStorage.setItem(BridgeLocalStorageKeys.BRIDGE_INFO, JSON.stringify({ ...bridgeInfo, [key]: value }))
}

const MULTICHAIN_API = `https://bridgeapi.anyswap.exchange`
const fetchListChainSupport = () => {
  return axios.get(`${MULTICHAIN_API}/data/bridgeChainInfo`).then(data => data.data)
}
const fetchListTokenByChain = (chainId: ChainId) => {
  return axios.get(`${MULTICHAIN_API}/v4/tokenlistv4/${chainId}`).then(data => data.data)
}

export const fetchTokenVersion = () => {
  return axios.get(`https://bridgeapi.multichain.org/token/version`).then(data => data.data)
}

const getTokenListCache = () => {
  try {
    let local: any = localStorage.getItem(BridgeLocalStorageKeys.TOKEN_LIST) || '{}'
    local = JSON.parse(local)
    return local
  } catch (error) {
    return {}
  }
}
const filterTokenList = (tokens: { [key: string]: MultiChainTokenInfo }) => {
  try {
    // filter wrong address, to reduce trash token and local storage size
    Object.keys(tokens).forEach(key => {
      const token = { ...tokens[key] }
      const { destChains } = token
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
    })
  } catch (error) {}
  return tokens
}
export async function getTokenlist(chainId: ChainId, isStaleData: boolean) {
  let tokens
  try {
    let local: any = getTokenListCache()
    if (local[chainId] && !isStaleData) {
      return local[chainId]
    }
    tokens = await fetchListTokenByChain(chainId)
    tokens = filterTokenList(tokens)
    local = getTokenListCache()
    try {
      localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ ...local, [chainId]: tokens }))
    } catch (error) {
      console.log('overflow localstorage QuotaExceededError')
      localStorage.removeItem(BridgeLocalStorageKeys.TOKEN_LIST)
      localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ [chainId]: tokens }))
    }
    return tokens
  } catch (e) {
    console.log(e.toString())
    return {}
  }
}

export async function getChainlist(isStaleData: boolean) {
  try {
    const chainIds = getBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED)
    if (chainIds && !isStaleData) {
      return chainIds
    }
    const tokens = await fetchListChainSupport()
    const filter = Object.keys(tokens)
      .map(Number)
      .filter(id => !!NETWORKS_INFO_CONFIG[id as ChainId])
    setBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED, filter)
    return filter
  } catch (e) {
    console.log(e)
    return []
  }
}
