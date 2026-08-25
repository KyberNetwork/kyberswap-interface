import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'

import useTokenBalance from 'hooks/useTokenBalance'
import {
  CAPITAL_PERCENTAGES,
  type CapitalAction,
  type CapitalInputQuoteToken,
  type CapitalPercentage,
  type CapitalPreset,
  getCapitalInputQuoteToken,
} from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { formatPreparedAmount, parsePreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

type UseCapitalAmountProps = {
  account?: string
  action: CapitalAction
  connectedChainId?: number
  targetChainId: number
}

type CapitalAmountErrorParams = {
  amount: string
  amountBelowMinimum: boolean
  amountRaw?: string
  insufficientBalance: boolean
  minimumAmountRaw?: string
  quoteToken?: CapitalInputQuoteToken
}

const getCapitalAmountError = ({
  amount,
  amountBelowMinimum,
  amountRaw,
  insufficientBalance,
  minimumAmountRaw,
  quoteToken,
}: CapitalAmountErrorParams) => {
  if (!amount || !quoteToken || !minimumAmountRaw) return undefined
  if (!amountRaw || amountBelowMinimum) {
    return `Minimum amount is ${formatPreparedAmount(minimumAmountRaw, quoteToken)}`
  }
  if (insufficientBalance) return `Insufficient ${quoteToken.symbol} balance`
  return undefined
}

export const useCapitalAmount = ({ account, action, connectedChainId, targetChainId }: UseCapitalAmountProps) => {
  const [amount, setAmount] = useState('')

  const quoteToken = getCapitalInputQuoteToken(targetChainId)
  const quoteCurrency = useMemo(
    () =>
      quoteToken
        ? new Token(targetChainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
        : undefined,
    [quoteToken, targetChainId],
  )

  const walletBalance = useTokenBalance(quoteToken?.address || '', targetChainId as ChainId)
  const walletBalanceLoading = !!account && !!quoteToken && walletBalance.isLoading
  const walletBalanceRaw = account && quoteToken && !walletBalanceLoading ? walletBalance.value.toString() : undefined

  const presetAmounts = useMemo<CapitalPreset[] | undefined>(() => {
    if (!quoteToken || !walletBalanceRaw) return undefined

    return CAPITAL_PERCENTAGES.map(percentage => ({
      percentage,
      amount: formatUnits((BigInt(walletBalanceRaw) * BigInt(percentage)) / 100n, quoteToken.decimals),
    }))
  }, [quoteToken, walletBalanceRaw])

  const amountRaw = useMemo(() => {
    if (!quoteToken) return undefined

    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])

  const minimumAmountRaw = quoteToken?.minimumAmountRaw[action]
  const amountBelowMinimum = !!amountRaw && !!minimumAmountRaw && BigInt(amountRaw) < BigInt(minimumAmountRaw)
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError = getCapitalAmountError({
    amount,
    amountBelowMinimum,
    amountRaw,
    insufficientBalance,
    minimumAmountRaw,
    quoteToken,
  })
  const amountIsValid = !!amountRaw && !amountBelowMinimum && !insufficientBalance && !walletBalanceLoading

  const onExpectedChain = connectedChainId === targetChainId
  const presetsEnabled = !!account && onExpectedChain && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : '0'

  const getPreset = (percentage: CapitalPercentage) => presetAmounts?.find(item => item.percentage === percentage)

  return {
    amount,
    amountError,
    amountIsValid,
    amountRaw,
    getPreset,
    onExpectedChain,
    presetAmounts,
    presetsEnabled,
    quoteCurrency,
    quoteToken,
    setAmount,
    walletBalanceLoading,
    walletBalanceText,
  }
}
