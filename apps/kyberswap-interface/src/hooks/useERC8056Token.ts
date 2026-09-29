import { ChainId, Currency, CurrencyAmount, Price, Rounding } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

/** Scales a raw token amount to its ERC-8056 display amount (rounded down); other tokens pass through. */
export const getERC8056DisplayAmount = <T extends CurrencyAmount<Currency> | undefined>(
  info: ERC8056TokenInfo,
  rawAmount: T,
): T => {
  if (!rawAmount || !info.multiplier) return rawAmount

  const uiAmount = (BigInt(rawAmount.quotient.toString()) * info.multiplier) / UI_MULTIPLIER_SCALE
  return CurrencyAmount.fromRawAmount(rawAmount.currency, uiAmount.toString()) as T
}

export const useERC8056DisplayBalance = (
  info: ERC8056TokenInfo,
  rawBalance: CurrencyAmount<Currency> | undefined,
): CurrencyAmount<Currency> | undefined => {
  return useMemo(() => getERC8056DisplayAmount(info, rawBalance), [info, rawBalance])
}

/** Scales a raw price to display units on whichever side of the pair is an ERC-8056 token. */
export const getERC8056DisplayPrice = <T extends Price<Currency, Currency> | undefined>(
  price: T,
  baseInfo: ERC8056TokenInfo,
  quoteInfo: ERC8056TokenInfo,
): T => {
  if (!price || (!baseInfo.multiplier && !quoteInfo.multiplier)) return price

  const baseScale = JSBI.BigInt((baseInfo.multiplier ?? UI_MULTIPLIER_SCALE).toString())
  const quoteScale = JSBI.BigInt((quoteInfo.multiplier ?? UI_MULTIPLIER_SCALE).toString())
  return new Price(
    price.baseCurrency,
    price.quoteCurrency,
    JSBI.multiply(price.denominator, baseScale),
    JSBI.multiply(price.numerator, quoteScale),
  ) as T
}

const trimTrailingZero = (value: string) => value.replace(/\.?0+$/, '') || '0'

// Raw → display rounds down and display → raw rounds up, so a raw amount converted to display and
// back never exceeds the original, and is exact for multipliers ≥ 1.
const scaleTypedValue = (value: string, numerator: bigint, denominator: bigint, rounding: Rounding): string =>
  trimTrailingZero(
    parseFraction(value)
      .multiply(JSBI.BigInt(numerator.toString()))
      .divide(JSBI.BigInt(denominator.toString()))
      .toFixed(18, undefined, rounding),
  )

const getERC8056DisplayTypedValue = (multiplier: bigint | undefined, rawValue: string): string => {
  if (!rawValue || !multiplier) return rawValue
  return scaleTypedValue(rawValue, multiplier, UI_MULTIPLIER_SCALE, Rounding.ROUND_DOWN)
}

const getERC8056RawTypedValue = (multiplier: bigint | undefined, displayValue: string): string => {
  if (!displayValue || !multiplier) return displayValue
  return scaleTypedValue(displayValue, UI_MULTIPLIER_SCALE, multiplier, Rounding.ROUND_UP)
}

type TypedInput = { text: string; raw: string; multiplier: bigint | undefined }

/**
 * Binds an amount input for an ERC-8056 token to a raw typed value, which stays the unit the rest of
 * the app shares (Limit Order form, `?input=` links). While the stored raw value is the one the user's
 * text produced, the input keeps that text verbatim, so partial entries such as `0.` or `0.0` survive
 * the conversion; if the multiplier then changes (it loads, or the token is switched), the text is kept
 * and the raw value is re-derived from it. Raw values written from elsewhere (Max, Half, Reverse through
 * `onRawValue`; Limit Order and `?input=` through the store) are shown converted to display units.
 */
export const useERC8056TypedInput = (
  info: ERC8056TokenInfo,
  rawTypedValue: string,
  onRawInput: (rawValue: string) => void,
): {
  displayTypedValue: string
  onDisplayInput: (displayValue: string) => void
  onRawValue: (rawValue: string) => void
} => {
  const { multiplier } = info
  const [typedInput, setTypedInput] = useState<TypedInput>()
  const ownsRawValue = typedInput?.raw === rawTypedValue

  const onDisplayInput = useCallback(
    (text: string) => {
      const raw = getERC8056RawTypedValue(multiplier, text)
      setTypedInput({ text, raw, multiplier })
      onRawInput(raw)
    },
    [multiplier, onRawInput],
  )

  // Drops the typed text first, so it cannot claim a raw value that happens to equal the one it produced.
  const onRawValue = useCallback(
    (raw: string) => {
      setTypedInput(undefined)
      onRawInput(raw)
    },
    [onRawInput],
  )

  useEffect(() => {
    if (!typedInput || !ownsRawValue || typedInput.multiplier === multiplier) return
    const raw = getERC8056RawTypedValue(multiplier, typedInput.text)
    setTypedInput({ text: typedInput.text, raw, multiplier })
    if (raw !== rawTypedValue) onRawInput(raw)
  }, [multiplier, onRawInput, ownsRawValue, rawTypedValue, typedInput])

  const displayTypedValue = useMemo(
    () => (typedInput && ownsRawValue ? typedInput.text : getERC8056DisplayTypedValue(multiplier, rawTypedValue)),
    [multiplier, ownsRawValue, rawTypedValue, typedInput],
  )

  return { displayTypedValue, onDisplayInput, onRawValue }
}
