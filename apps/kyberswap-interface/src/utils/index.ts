import { ChainId, Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import Numeral from 'numeral'

import KNCLogoUrl from 'assets/images/KNC.svg'
import KNCLLogoUrl from 'assets/images/KNCL.png'
import { DEFAULT_GAS_LIMIT_MARGIN, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/tokens'
import { type Chain, NonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import store from 'state'
import { GroupedTxsByHash, TransactionDetails } from 'state/transactions/type'
import { isAddress, isAddressString } from 'utils/address'

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

export const shortenHash = (hash: string, chars = 3): string => {
  if (!hash) return ''
  if (hash.length < chars * 2) return hash

  const start = hash.substring(0, chars + 2)
  const end = hash.substring(hash.length - chars)

  return `${start}...${end}`
}

/**
 * Add a margin amount equal to max of 20000 or the configured percentage of estimatedGas.
 * The default percentage is 20% (50% on Polygon and Optimism).
 */
export function calculateGasMarginBigInt(value: bigint, chainId?: ChainId, minimumMarginBps = 2000): bigint {
  const defaultGasLimitMargin = BigInt(DEFAULT_GAS_LIMIT_MARGIN)
  const needHigherGas = [ChainId.MATIC, ChainId.OPTIMISM].includes(chainId as ChainId)
  const chainMarginBps = needHigherGas ? 5000 : 2000
  const gasMargin = (value * BigInt(Math.max(chainMarginBps, minimumMarginBps))) / 10000n
  return gasMargin >= defaultGasLimitMargin ? value + gasMargin : value + defaultGasLimitMargin
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

  if (address.toLowerCase() === KNC_ADDRESS.toLowerCase()) {
    return KNCLogoUrl
  }

  if (address.toLowerCase() === KNCL_ADDRESS.toLowerCase()) {
    return KNCLLogoUrl
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
  typeof document === 'undefined' ? '' : document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''

export const enumToArrayOfValues = (enumObject: { [x: string]: unknown }, valueType?: string) =>
  Object.keys(enumObject)
    .map(key => enumObject[key])
    .filter(value => !valueType || typeof value === valueType)

const ancestorOrigins = typeof window !== 'undefined' ? window.location.ancestorOrigins : undefined
export const isInSafeApp = !!ancestorOrigins?.[ancestorOrigins.length - 1]?.includes('app.safe.global')

export const isEvmChain = (chain: Chain) => {
  return Object.values(ChainId).includes(chain)
}
export const isNonEvmChain = (chain: Chain) => {
  return Object.values(NonEvmChain).includes(chain)
}
