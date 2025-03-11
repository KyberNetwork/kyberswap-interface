import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import axios from 'axios'

import { SUPPORTED_NETWORKS } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import { PoolBridgeValue } from 'state/crossChain/reducer'
import { formatNumberWithPrecisionRange, isAddress } from 'utils'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'

import { MultiChainTokenInfo } from './type'

export const BridgeLocalStorageKeys = {
  BRIDGE_INFO: 'bridgeInfo',
  SHOWED_DISCLAIMED: 'showedDisclaimed',
  SHOWED_DISCLAIMED_CROSS_CHAIN: 'showedDisclaimedCross',
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

const MULTICHAIN_API = `https://bridgeapi.multichain.org`
const fetchListChainSupport = () => {
  return axios.get(`${MULTICHAIN_API}/data/bridgeChainInfo`).then(data => data.data)
}
const fetchListTokenByChain = (chainId: ChainId) => {
  return axios.get(`${MULTICHAIN_API}/v4/tokenlistv4/${chainId}`).then(data => data.data)
}

export const fetchTokenVersion = () => {
  return axios.get(`${MULTICHAIN_API}/token/version`).then(data => data.data)
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
      tokens[key].symbol = getTokenSymbolWithHardcode(
        Number(tokens[key].chainId),
        tokens[key].address,
        tokens[key].symbol,
      )
      const token = { ...tokens[key] }
      const { destChains = {} } = token
      let hasChainSupport = false
      Object.keys(destChains).forEach((chain: string) => {
        Object.keys(destChains[chain]).forEach(address => {
          const info = destChains[chain][address]
          info.chainId = Number(info.chainId)
          info.symbol = getTokenSymbolWithHardcode(info.chainId, info.address, info.symbol)
          if (!isAddress(info.chainId, info.address)) {
            delete destChains[chain][address]
          }
        })
        if (SUPPORTED_NETWORKS.includes(Number(chain))) {
          hasChainSupport = true
        }
        if (!Object.keys(destChains[chain]).length) {
          delete destChains[chain]
        }
      })
      if (!hasChainSupport || !Object.keys(destChains).length) {
        delete tokens[key]
      }
    })
  } catch (error) {}
  return tokens
}
export async function getTokenlist(chainId: ChainId, isStaleData: boolean) {
  let tokens
  let local: any
  try {
    local = getTokenListCache()
    if (local[chainId] && Object.keys(local[chainId]).length && !isStaleData) {
      return local[chainId]
    }
    tokens = await fetchListTokenByChain(chainId)
    tokens = filterTokenList(tokens)
    local = getTokenListCache() // make sure get latest data
    try {
      const filterChain = Object.keys(local).reduce<{ [chainId: string]: any }>((rs, chainId) => {
        if (!Object.keys(rs).length) {
          rs[chainId] = local[chainId]
        }
        return rs
      }, {})
      // only store info 2 chain
      localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ ...filterChain, [chainId]: tokens }))
    } catch (error) {
      console.log('overflow localstorage QuotaExceededError')
      localStorage.removeItem(BridgeLocalStorageKeys.TOKEN_LIST)
      try {
        // still overflow, don't save into local
        localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ [chainId]: tokens }))
      } catch (error) {}
    }
    return tokens
  } catch (e) {
    console.log(e.toString())
    return local?.[chainId] || {}
  }
}

export async function getChainlist(isStaleData: boolean) {
  let chainIds: number[] = []
  try {
    chainIds = getBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED)
    if (chainIds && !isStaleData) {
      return chainIds
    }
    const tokens = await fetchListChainSupport()
    const filter = Object.keys(tokens)
      .map(Number)
      .filter(id => SUPPORTED_NETWORKS.includes(id))
    setBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED, filter)
    return filter
  } catch (e) {
    console.log(e)
    return chainIds || []
  }
}

export const formatPoolValue = (amount: PoolBridgeValue) => {
  try {
    if (amount === null) return t`loading`
    if (amount === undefined) return t`Unlimited`
    if (Number(amount) && amount) return formatNumberWithPrecisionRange(parseFloat(amount + ''), 0, 2)
  } catch (error) {}
  return '0'
}

/**
  1.123456 => 1.12
  12.123456 => 12.12
  123.123456 => 123.12
  1234.123456 => 1,234.12
  12345.123456 => 12,345.12
  123456.123456 => 123,456.12
  1234567.123456 => 1,234,567.12
  12345678.123456 => 12,345,678.12
  123456789.123456 => 123.457M
  1234567890.123456 => 1.23457B
  12345678901.123456 => 12.3457B
  123456789012.123456 => 123.457B
  1234567890123.123456 => 1.23457T
 */
/** @deprecated use formatDisplayNumber instead */
export const formatAmountBridge = (rawAmount: string) => {
  const amount = parseFloat(String(rawAmount) ?? '0')
  if (amount > 100_000_000) {
    const formatter = Intl.NumberFormat('en-US', {
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 6,
    })

    return formatter.format(amount)
  }

  return formatNumberWithPrecisionRange(amount, 0, 16)
}

export const getLabelByStatus = (status: MultichainTransferStatus): string => {
  const labelByGeneralStatus: Record<MultichainTransferStatus, string> = {
    [MultichainTransferStatus.Success]: t`Success`,
    [MultichainTransferStatus.Failure]: t`Failed`,
    [MultichainTransferStatus.Processing]: t`Processing`,
  }

  return labelByGeneralStatus[status]
}
