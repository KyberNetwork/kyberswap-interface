import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'

import useTokenBalance from 'hooks/useTokenBalance'
import {
  CAPITAL_PERCENTAGES,
  type CapitalAction,
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
  const walletBalanceRaw = account && quoteToken ? walletBalance.value.toString() : undefined

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
  const amountError =
    !amount || !quoteToken || !minimumAmountRaw
      ? undefined
      : !amountRaw || amountBelowMinimum
      ? `Minimum amount is ${formatPreparedAmount(minimumAmountRaw, quoteToken)}.`
      : insufficientBalance
      ? `Insufficient ${quoteToken.symbol} balance.`
      : undefined
  const amountIsValid = !!amountRaw && !amountBelowMinimum && !insufficientBalance

  const onExpectedChain = connectedChainId === targetChainId
  const presetsEnabled = !!account && onExpectedChain && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : account
      ? '0'
      : 'Connect wallet'

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
    walletBalanceText,
  }
}
