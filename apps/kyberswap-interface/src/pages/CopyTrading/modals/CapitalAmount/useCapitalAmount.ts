import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useRef, useState } from 'react'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import useTokenBalance from 'hooks/useTokenBalance'
import { useChainQuoteToken } from 'pages/CopyTrading/hooks/useChainQuoteToken'
import {
  type CapitalPercentage,
  FUNDING_TOKEN_CHANGED,
  MINIMUM_CAPITAL_AMOUNT,
  resolveFundingToken,
} from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { isPreparationFailure, parsePreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits, parseUnits } from 'utils/viem'

type UseCapitalAmountProps = {
  account?: string
  connectedChainId?: number
  targetChainId: number
}

export const useCapitalAmount = ({ account, connectedChainId, targetChainId }: UseCapitalAmountProps) => {
  const { quoteToken, quoteCurrency } = useChainQuoteToken(targetChainId)
  const [amount, setAmount] = useState('')

  const walletBalance = useTokenBalance(quoteToken.address, targetChainId as ChainId)
  const walletBalanceLoading = !!account && walletBalance.isLoading
  const walletBalanceRaw = account && !walletBalanceLoading ? walletBalance.value.toString() : undefined

  const amountRaw = useMemo(() => {
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])

  const amountBelowMinimum = !!amountRaw && BigInt(amountRaw) < parseUnits(MINIMUM_CAPITAL_AMOUNT, quoteToken.decimals)
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError =
    amount && !amountRaw
      ? 'Enter a positive amount within the token precision.'
      : amountBelowMinimum
      ? `Minimum amount is ${MINIMUM_CAPITAL_AMOUNT} ${quoteToken.symbol || quoteToken.address}`
      : insufficientBalance
      ? `Insufficient ${quoteToken.symbol || quoteToken.address} balance`
      : undefined
  const amountIsValid = !!amountRaw && !amountBelowMinimum && !insufficientBalance && !walletBalanceLoading

  const currentFunding = useRef({ quoteToken, amountRaw })
  currentFunding.current = { quoteToken, amountRaw }
  const validatePreparation = (action: PreparedAction): PreparedAction => {
    if (isPreparationFailure(action)) return action
    const isPendingOrCompleted =
      action.status === 'PREPARED_ACTION_STATUS_PENDING' || action.status === 'PREPARED_ACTION_STATUS_COMPLETED'
    if (
      !isPendingOrCompleted &&
      action.status !== 'PREPARED_ACTION_STATUS_READY' &&
      action.status !== 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED' &&
      action.reason !== 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'
    )
      return action
    const current = currentFunding.current
    const preparedAmount = action.startCopy?.requestedTargetRaw ?? action.addCapital?.addedCapitalRaw
    if (!current.amountRaw || preparedAmount !== current.amountRaw)
      throw new Error('Review the amount and prepare again.')
    if (isPendingOrCompleted) return action

    if (Number(action.chainId) !== Number(current.quoteToken.chainId)) throw new Error(FUNDING_TOKEN_CHANGED)
    const preview = action.startCopy ? 'startCopy' : 'addCapital'
    const data = action[preview]
    const token = resolveFundingToken(data?.quoteToken, current.quoteToken)
    return { ...action, [preview]: { ...data, quoteToken: token } }
  }

  const onExpectedChain = connectedChainId === targetChainId
  const presetsEnabled = !!account && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText = walletBalanceRaw
    ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
    : '0'

  const getPresetAmount = (percentage: CapitalPercentage) =>
    walletBalanceRaw
      ? formatUnits((BigInt(walletBalanceRaw) * BigInt(percentage)) / 100n, quoteToken.decimals)
      : undefined

  return {
    amount,
    amountError,
    validatePreparation,
    amountIsValid,
    amountRaw,
    getPresetAmount,
    onExpectedChain,
    presetsEnabled,
    quoteCurrency,
    quoteToken,
    setAmount,
    walletBalanceLoading,
    walletBalanceText,
  }
}
