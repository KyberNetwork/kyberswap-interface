import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'

import useTokenBalance from 'hooks/useTokenBalance'
import {
  formatPreparedAmount,
  getInputQuoteToken,
  parsePreparedAmount,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  CAPITAL_PERCENTAGES,
  type CapitalPercentage,
  type CapitalPreset,
  type StartCopyTarget,
} from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

export const useStartCopyAmount = ({
  account,
  agent,
  chainId,
}: {
  account?: string
  agent: StartCopyTarget
  chainId?: number
}) => {
  const [amount, setAmount] = useState('')

  const quoteToken = getInputQuoteToken(agent.chainId)
  const quoteCurrency = useMemo(
    () =>
      quoteToken
        ? new Token(agent.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
        : undefined,
    [agent.chainId, quoteToken],
  )

  const walletBalance = useTokenBalance(quoteToken?.address || '', agent.chainId as ChainId)
  const walletBalanceRaw = account && quoteToken ? walletBalance.value.toString() : undefined

  const presetAmounts = useMemo<CapitalPreset[] | undefined>(() => {
    if (!quoteToken || !walletBalanceRaw) return undefined

    return CAPITAL_PERCENTAGES.map(percentage => ({
      percentage,
      amount: formatUnits((BigInt(walletBalanceRaw) * BigInt(percentage)) / 100n, quoteToken.decimals),
    }))
  }, [quoteToken, walletBalanceRaw])

  const targetCapitalRaw = useMemo(() => {
    if (!quoteToken) return undefined

    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])

  const amountBelowMinimum =
    !!targetCapitalRaw && !!quoteToken && BigInt(targetCapitalRaw) < BigInt(quoteToken.minimumStartCopyCapitalRaw)
  const insufficientBalance =
    !!targetCapitalRaw && !!walletBalanceRaw && BigInt(targetCapitalRaw) > BigInt(walletBalanceRaw)
  const amountError =
    !amount || !quoteToken
      ? undefined
      : !targetCapitalRaw || amountBelowMinimum
      ? `Minimum amount is ${formatPreparedAmount(quoteToken.minimumStartCopyCapitalRaw, quoteToken)}.`
      : insufficientBalance
      ? `Insufficient ${quoteToken.symbol} balance.`
      : undefined

  const amountIsValid = !!targetCapitalRaw && !amountBelowMinimum && !insufficientBalance
  const onExpectedChain = chainId === agent.chainId
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
    getPreset,
    onExpectedChain,
    presetAmounts,
    presetsEnabled,
    quoteCurrency,
    quoteToken,
    setAmount,
    targetCapitalRaw,
    walletBalanceText,
  }
}
