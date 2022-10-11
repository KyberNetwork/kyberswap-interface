import { ChainId } from '@kyberswap/ks-sdk-core'
import axios from 'axios'

import { NETWORKS_INFO_CONFIG } from 'constants/networks'

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

export async function getTokenlist(chainId: ChainId, isStaleData: boolean) {
  let tokens
  try {
    let local: any = localStorage.getItem(BridgeLocalStorageKeys.TOKEN_LIST) || '{}'
    local = JSON.parse(local)
    if (local[chainId] && !isStaleData) {
      return local[chainId]
    }
    tokens = await fetchListTokenByChain(chainId)
    localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ ...local, [chainId]: tokens }))
    return tokens
  } catch (e) {
    if (e.toString().includes(`QuotaExceededError: Failed to execute 'setItem' on 'Storage'`)) {
      console.log('overflow localstorage')
      localStorage.removeItem(BridgeLocalStorageKeys.TOKEN_LIST)
      if (tokens) return tokens
    }
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
