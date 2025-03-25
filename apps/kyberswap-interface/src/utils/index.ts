import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import Numeral from 'numeral'

import { GET_BLOCKS } from 'apollo/queries'
import { ENV_KEY } from 'constants/env'
import { DEFAULT_GAS_LIMIT_MARGIN, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/tokens'
import store from 'state'
import { GroupedTxsByHash, TransactionDetails } from 'state/transactions/type'

import { isAddress, isAddressString } from './address'

export { isAddress, isAddressString }

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string {
  const prefix = NETWORKS_INFO[chainId].etherscanUrl

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      if (chainId === ChainId.ZKSYNC) return `${prefix}/address/${data}`
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(chainId: ChainId, address: string, chars = 4, checksum = true): string {
  const parsed = isAddress(chainId, address)
  if (!parsed && checksum) {
    throw Error(`Invalid 'address' parameter '${address}' on chain ${chainId}.`)
  }
  const value = (checksum && parsed ? parsed : address) ?? ''
  return `${value.substring(0, chars + 2)}...${value.substring(42 - chars)}`
}

/**
 * Add a margin amount equal to max of 20000 or 20% of estimatedGas
 * total = estimate + max(20k, 20% * estimate)
 *
 * @param value BigNumber
 * @returns BigNumber
 */
export function calculateGasMargin(value: BigNumber, chainId?: ChainId): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(DEFAULT_GAS_LIMIT_MARGIN)
  const needHigherGas = [ChainId.MATIC, ChainId.OPTIMISM].includes(chainId as ChainId)
  const gasMargin = value.mul(BigNumber.from(needHigherGas ? 5000 : 2000)).div(BigNumber.from(10000))

  return gasMargin.gte(defaultGasLimitMargin) ? value.add(gasMargin) : value.add(defaultGasLimitMargin)
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount<Currency>, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export const toK = (num: string) => {
  return Numeral(num).format('0.[00]a')
}

export const toKInChart = (num: string, unit?: string) => {
  if (parseFloat(num) < 0.0000001) return `< ${unit ?? ''}0.0000001`
  if (parseFloat(num) >= 0.1) return (unit ?? '') + Numeral(num).format('0.[00]a')
  return (unit ?? '') + Numeral(num).format('0.[0000000]a')
}

// using a currency library here in case we want to add more in future
const formatDollarFractionAmount = (num: number, digits: number) => {
  const formatter = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return formatter.format(num)
}

const formatDollarSignificantAmount = (num: number, minDigits: number, maxDigits?: number) => {
  const formatter = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: 'USD',
    minimumSignificantDigits: minDigits,
    maximumSignificantDigits: maxDigits ?? minDigits,
  })
  return formatter.format(num)
}
/** @deprecated use formatDisplayNumber instead
 * @example formatDisplayNumber(number, { style: 'decimal', significantDigits: 2 })
 */
export function formatNumberWithPrecisionRange(number: number, minPrecision = 2, maxPrecision = 2) {
  const options = {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: maxPrecision,
  }
  return number.toLocaleString(undefined, options)
}

// Take only 6 fraction digits
// This returns a different result compared to toFixed
// 0.000297796.toFixed(6) = 0.000298
// truncateFloatNumber(0.000297796) = 0.000297
const truncateFloatNumber = (num: number, maximumFractionDigits = 6) => {
  const [wholePart, fractionalPart] = String(num).split('.')

  if (!fractionalPart) {
    return wholePart
  }

  return `${wholePart}.${fractionalPart.slice(0, maximumFractionDigits)}`
}

/** @deprecated use formatDisplayNumber instead
 * @example formatDisplayNumber(number, { style: 'currency' | 'decimal', significantDigits: 6 })
 */
export function formattedNum(number: string | number, usd = false, fractionDigits = 5): string {
  if (number === 0 || number === '' || number === undefined) {
    return usd ? '$0' : '0'
  }

  const num = parseFloat(String(number))

  if (num > 500000000) {
    return (usd ? '$' : '') + toK(num.toFixed(0))
  }

  if (num >= 1000) {
    return usd ? formatDollarFractionAmount(num, 0) : Number(num.toFixed(0)).toLocaleString()
  }

  if (num === 0) {
    if (usd) {
      return '$0'
    }
    return '0'
  }

  if (num < 0.0001) {
    return usd ? '< $0.0001' : '< 0.0001'
  }

  if (usd) {
    if (num < 0.1) {
      return formatDollarFractionAmount(num, 4)
    } else {
      return formatDollarFractionAmount(num, 2)
    }
  }

  // this function can be replaced when `roundingMode` of `Intl.NumberFormat` is widely supported
  // this function is to avoid this case
  // 0.000297796.toFixed(6) = 0.000298
  // truncateFloatNumber(0.000297796) = 0.000297
  return truncateFloatNumber(num, fractionDigits)
}

/** @deprecated use formatDisplayNumber instead
 * @example formatDisplayNumber(number, { style: 'currency' | 'decimal', significantDigits: 6 })
 */
export function formattedNumLong(num: number, usd = false) {
  if (num === 0) {
    if (usd) {
      return '$0'
    }
    return '0'
  }

  if (num > 1000) {
    return usd ? formatDollarFractionAmount(num, 0) : Number(num.toFixed(0)).toLocaleString()
  }

  if (usd) return formatDollarSignificantAmount(num, 1, 4)

  return Number(num.toFixed(5)).toLocaleString()
}

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: string, value24HoursAgo: string) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0
  }

  return adjustedPercentChange
}

export function getTimestampsForChanges(): [number, number, number] {
  const utcCurrentTime = dayjs()
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix()
  return [t1, t2, tWeek]
}

export async function splitQuery<ResultType, T, U>(
  query: (values: T[], ...vars: U[]) => import('graphql').DocumentNode,
  localClient: ApolloClient<NormalizedCacheObject>,
  list: T[],
  vars: U[],
  skipCount = 100,
): Promise<
  | {
      [key: string]: ResultType
    }
  | undefined
> {
  let fetchedData = {}
  let allFound = false
  let skip = 0

  while (!allFound) {
    let end = list.length
    if (skip + skipCount < list.length) {
      end = skip + skipCount
    }
    const sliced = list.slice(skip, end)
    const result = await localClient.query({
      query: query(sliced, ...vars),
      fetchPolicy: 'no-cache',
    })
    fetchedData = {
      ...fetchedData,
      ...result.data,
    }
    if (Object.keys(result.data).length < skipCount || skip + skipCount > list.length) {
      allFound = true
    } else {
      skip += skipCount
    }
  }

  return fetchedData
}

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
async function getBlocksFromTimestampsSubgraph(
  blockClient: ApolloClient<NormalizedCacheObject>,
  timestamps: number[],
): Promise<{ timestamp: number; number: number }[]> {
  if (timestamps?.length === 0) {
    return []
  }

  const fetchedData = await splitQuery<{ number: string }[], number, any>(GET_BLOCKS, blockClient, timestamps, [])
  const blocks: { timestamp: number; number: number }[] = []
  if (fetchedData) {
    for (const t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          timestamp: Number(t.split('t')[1]),
          number: Number(fetchedData[t][0]['number']),
        })
      }
    }
  }

  return blocks
}

// TODO: Remove
export async function getBlocksFromTimestamps(
  _isEnableBlockService: boolean,
  blockClient: ApolloClient<NormalizedCacheObject>,
  timestamps: number[],
  _chainId: ChainId,
): Promise<{ timestamp: number; number: number }[]> {
  return getBlocksFromTimestampsSubgraph(blockClient, timestamps)
}

/**
 * gets the amount difference in 24h
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const get24hValue = (valueNow: string, value24HoursAgo: string | undefined): number => {
  if (value24HoursAgo === undefined) {
    return 0
  }
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)

  return currentChange
}

export const getNativeTokenLogo = (chainId: ChainId) => {
  return (
    store.getState()?.lists?.mapWhitelistTokens?.[chainId]?.[ETHER_ADDRESS]?.logoURI ||
    (chainId ? NETWORKS_INFO[chainId].nativeToken.logo : '')
  )
}

export const getTokenLogoURL = (inputAddress: string, chainId: ChainId): string => {
  let address = inputAddress
  if (address === ZERO_ADDRESS) {
    address = WETH[chainId].address
  }

  if (address.toLowerCase() === KNC_ADDRESS) {
    return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNC.svg'
  }

  if (address.toLowerCase() === KNCL_ADDRESS.toLowerCase()) {
    return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNCL.png'
  }

  // WBTC
  if (address.toLowerCase() === '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f') {
    return 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744'
  }

  const imageURL = store.getState()?.lists?.mapWhitelistTokens?.[chainId]?.[address]?.logoURI
  return imageURL || ''
}

// push unique
// return original instance if no change
export const pushUnique = <T>(array: T[] | undefined, element: T): T[] => {
  if (!array) return [element]

  const set = new Set<T>(array)

  if (set.has(element)) return array
  return [...array, element]
}

// delete unique
// return original instance if no change
export const deleteUnique = <T>(array: T[] | undefined, element: T): T[] => {
  if (!array) return []

  const set = new Set<T>(array)

  if (set.has(element)) {
    set.delete(element)
    return [...set]
  }
  return array
}

export const filterTruthy = <T>(array: (T | undefined | null | false)[]): T[] => {
  return array.filter(Boolean) as T[]
}

export const findTx = (txs: GroupedTxsByHash | undefined, hash: string): TransactionDetails | undefined => {
  return txs
    ? txs?.[hash]?.[0] ||
        Object.values(txs)
          .flat()
          .find(tx => tx?.hash === hash)
    : undefined
}

export const isChristmasTime = () => {
  const currentTime = dayjs()
  return currentTime.month() === 11 && currentTime.date() >= 12
}

export const isSupportLimitOrder = (chainId: ChainId): boolean => {
  if (!SUPPORTED_NETWORKS.includes(chainId)) return false
  const limitOrder = NETWORKS_INFO[chainId]?.limitOrder
  return limitOrder === '*' || (limitOrder || []).includes(ENV_KEY)
}

export function openFullscreen(elem: any) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.webkitRequestFullScreen) {
    /* Old webkit */
    elem.webkitRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) {
    /* New webkit */
    elem.webkitRequestFullscreen()
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen()
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen()
  }
}

export const downloadImage = (data: Blob | string | undefined, filename: string) => {
  if (!data) return
  const link = document.createElement('a')
  link.download = filename
  link.href = typeof data === 'string' ? data : URL.createObjectURL(data)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function buildFlagsForFarmV21({
  isClaimFee,
  isSyncFee,
  isClaimReward,
  isReceiveNative,
}: {
  isClaimFee: boolean
  isSyncFee: boolean
  isClaimReward: boolean
  isReceiveNative: boolean
}) {
  let flags = 1
  if (isReceiveNative) flags = 1
  if (isClaimFee) flags = flags | (1 << 3)
  if (isSyncFee) flags = flags | (1 << 2)
  if (isClaimReward) flags = flags | (1 << 1)
  return flags
}

export const getCookieValue = (name: string) =>
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''

export const enumToArrayOfValues = (enumObject: { [x: string]: unknown }, valueType?: string) =>
  Object.keys(enumObject)
    .map(key => enumObject[key])
    .filter(value => !valueType || typeof value === valueType)
