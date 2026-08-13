import { ChainId, Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useReadContract } from 'wagmi'

import { useReadingContract } from 'hooks/useContract'
import { parseFraction } from 'utils/numbers'
import { parseAbi } from 'utils/viem'

const UI_MULTIPLIER_SCALE = 10n ** 18n
const ERC8056_CORE_INTERFACE_ID = '0xa60bf13d'
const ERC8056_ABI = parseAbi([
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function uiMultiplier() view returns (uint256)',
])

export type ERC8056TokenInfo = {
  enabled: boolean
  isLoading: boolean
  isScaled: boolean
  multiplier: bigint | undefined
}

/** Detects a selected ERC-8056 token on supported chains and caches the result for the page session. */
export const useERC8056TokenInfo = (currency: Currency | undefined, chainId: ChainId): ERC8056TokenInfo => {
  const enabled = [ChainId.BSCMAINNET, ChainId.ROBINHOOD].includes(chainId) && Boolean(currency?.isToken)
  const contract = useReadingContract(enabled ? currency?.wrapped.address : undefined, ERC8056_ABI, chainId)

  // Keep ERC-165 as the detection gate, but only check the core interface
  // needed for uiMultiplier(). Contract reverts are an expected negative
  // result for ordinary tokens, so do not retry them and spend extra RPC quota.
  const { data: supportsCore, isLoading: isLoadingSupport } = useReadContract({
    address: contract?.address,
    abi: ERC8056_ABI,
    functionName: 'supportsInterface',
    args: [ERC8056_CORE_INTERFACE_ID],
    chainId,
    query: { enabled: Boolean(contract), staleTime: Infinity, gcTime: Infinity, retry: false },
  })
  const supportsERC8056 = enabled && supportsCore === true
  const { data: rawMultiplier, isLoading: isLoadingMultiplier } = useReadContract({
    address: contract?.address,
    abi: ERC8056_ABI,
    functionName: 'uiMultiplier',
    chainId,
    query: { enabled: Boolean(contract) && supportsERC8056, staleTime: Infinity, gcTime: Infinity, retry: false },
  })

  // A missing/reverting/zero multiplier is treated as a regular token. A 1.0
  // multiplier is compliant but has no display discrepancy, so it also needs
  // neither scaling nor the user-facing notice.
  const multiplier =
    supportsERC8056 && rawMultiplier !== undefined && rawMultiplier > 0n && rawMultiplier !== UI_MULTIPLIER_SCALE
      ? rawMultiplier
      : undefined

  return useMemo(
    () => ({
      enabled,
      isLoading: enabled && (isLoadingSupport || (supportsERC8056 && isLoadingMultiplier)),
      isScaled: multiplier !== undefined,
      multiplier,
    }),
    [enabled, isLoadingMultiplier, isLoadingSupport, multiplier, supportsERC8056],
  )
}

export const useERC8056DisplayBalance = (
  info: ERC8056TokenInfo,
  rawBalance: CurrencyAmount<Currency> | undefined,
): CurrencyAmount<Currency> | undefined => {
  return useMemo(() => {
    if (!rawBalance || !info.multiplier) return rawBalance

    const uiBalance = (BigInt(rawBalance.quotient.toString()) * info.multiplier) / UI_MULTIPLIER_SCALE
    return CurrencyAmount.fromRawAmount(rawBalance.currency, uiBalance.toString())
  }, [info.multiplier, rawBalance])
}

const trimTrailingZero = (value: string) => value.replace(/\.?0+$/, '') || '0'

const formatFractionValue = (value: Fraction) => trimTrailingZero(value.toFixed(18))

const getERC8056DisplayTypedValueByMultiplier = (multiplier: bigint | undefined, rawTypedValue: string): string => {
  if (!rawTypedValue || !multiplier) return rawTypedValue
  return formatFractionValue(
    parseFraction(rawTypedValue)
      .multiply(JSBI.BigInt(multiplier.toString()))
      .divide(JSBI.BigInt(UI_MULTIPLIER_SCALE.toString())),
  )
}

const getERC8056RawTypedValueByMultiplier = (multiplier: bigint | undefined, displayTypedValue: string): string => {
  if (!displayTypedValue || !multiplier) return displayTypedValue
  return formatFractionValue(
    parseFraction(displayTypedValue)
      .multiply(JSBI.BigInt(UI_MULTIPLIER_SCALE.toString()))
      .divide(JSBI.BigInt(multiplier.toString())),
  )
}

export const getERC8056DisplayTypedValue = (info: ERC8056TokenInfo, rawTypedValue: string): string =>
  getERC8056DisplayTypedValueByMultiplier(info.multiplier, rawTypedValue)

export const getERC8056RawTypedValue = (info: ERC8056TokenInfo, displayTypedValue: string): string =>
  getERC8056RawTypedValueByMultiplier(info.multiplier, displayTypedValue)

export const useERC8056DisplayTypedValue = (info: ERC8056TokenInfo, rawTypedValue: string): string => {
  const multiplier = info.multiplier
  return useMemo(() => getERC8056DisplayTypedValueByMultiplier(multiplier, rawTypedValue), [multiplier, rawTypedValue])
}

export const useERC8056RawTypedValue = (info: ERC8056TokenInfo, displayTypedValue: string): string => {
  const multiplier = info.multiplier
  return useMemo(
    () => getERC8056RawTypedValueByMultiplier(multiplier, displayTypedValue),
    [multiplier, displayTypedValue],
  )
}
