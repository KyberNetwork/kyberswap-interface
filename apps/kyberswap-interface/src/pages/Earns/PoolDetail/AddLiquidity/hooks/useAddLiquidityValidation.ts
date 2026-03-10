import { formatUnits } from '@ethersproject/units'
import { NATIVE_TOKEN_ADDRESS, Token } from '@kyber/schema'
import { useMemo } from 'react'

import { formatDisplayNumber } from 'utils/numbers'

const getDecimalCount = (value: string) => {
  if (!value.includes('.')) return 0
  return value.split('.')[1]?.length || 0
}

interface UseAddLiquidityValidationProps {
  tokens: Token[]
  amounts: string
  balances: Record<string, bigint | number | string | undefined>
  isUniV3: boolean
  tickLower: number | null
  tickUpper: number | null
}

export default function useAddLiquidityValidation({
  tokens,
  amounts,
  balances,
  isUniV3,
  tickLower,
  tickUpper,
}: UseAddLiquidityValidationProps) {
  const hasPositiveInput = useMemo(
    () => amounts.split(',').some(amount => Number.isFinite(Number(amount.trim())) && Number(amount.trim()) > 0),
    [amounts],
  )
  const parsedTokensIn = useMemo(
    () =>
      tokens
        .map((token, index) => ({
          token,
          amount: amounts.split(',')[index]?.trim() || '',
        }))
        .filter(item => Number.isFinite(Number(item.amount)) && Number(item.amount) > 0)
        .map(item => ({
          symbol: item.token.symbol,
          logoUrl: item.token.logo,
          amount: formatDisplayNumber(item.amount, {
            significantDigits: 6,
          }),
        })),
    [amounts, tokens],
  )
  const validationError = useMemo(() => {
    if (!tokens.length) return 'Select token in'
    if (!hasPositiveInput) return 'Enter amount'

    if (isUniV3) {
      if (tickLower === null) return 'Enter min price'
      if (tickUpper === null) return 'Enter max price'
      if (tickLower >= tickUpper) return 'Invalid price range'
    }

    try {
      for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]
        const amount = amounts.split(',')[index]?.trim() || ''
        if (!amount || Number(amount) <= 0) continue

        if (getDecimalCount(amount) > token.decimals) return 'Invalid input amount'

        const balanceKey =
          token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? NATIVE_TOKEN_ADDRESS.toLowerCase()
            : token.address.toLowerCase()
        const balance = formatUnits(balances[balanceKey]?.toString() || '0', token.decimals)
        if (Number(amount) > Number(balance)) return 'Insufficient balance'
      }
    } catch {
      return 'Invalid input amount'
    }

    return ''
  }, [amounts, balances, hasPositiveInput, isUniV3, tickLower, tickUpper, tokens])

  return {
    hasPositiveInput,
    parsedTokensIn,
    validationError,
  }
}
