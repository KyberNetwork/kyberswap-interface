import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useRef, useState } from 'react'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import useTokenBalance from 'hooks/useTokenBalance'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { useChainQuoteToken } from 'pages/CopyTrading/hooks/useChainQuoteToken'
import {
  CAPITAL_PERCENTAGES,
  type CapitalPercentage,
  type CapitalPreset,
  FUNDING_TOKEN_CHANGED,
  MINIMUM_CAPITAL_AMOUNT,
  getFundingTokenKey,
  resolveFundingToken,
} from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { parsePreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits, parseUnits } from 'utils/viem'

type UseCapitalAmountProps = {
  account?: string
  connectedChainId?: number
  targetChainId: number
}

export const useCapitalAmount = ({ account, connectedChainId, targetChainId }: UseCapitalAmountProps) => {
  const { refreshChains, chainsLoading } = useCopyTradingContext()
  const { quoteToken, quoteCurrency } = useChainQuoteToken(targetChainId)
  const tokenKey = getFundingTokenKey(targetChainId, quoteToken)
  const [input, setInput] = useState({ tokenKey, amount: '' })
  // Clear both decimal input and its raw value when token identity or precision changes.
  if (input.tokenKey !== tokenKey) setInput({ tokenKey, amount: '' })
  const amount = input.tokenKey === tokenKey ? input.amount : ''
  const setAmount = (amount: string) => setInput({ tokenKey, amount })

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

  const amountBelowMinimum =
    !!amountRaw && !!quoteToken && BigInt(amountRaw) < parseUnits(MINIMUM_CAPITAL_AMOUNT, quoteToken.decimals)
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError =
    amount && !amountRaw
      ? 'Enter a positive amount within the token precision.'
      : amountBelowMinimum
      ? `Minimum amount is ${MINIMUM_CAPITAL_AMOUNT} ${quoteToken?.symbol || quoteToken?.address}`
      : insufficientBalance
      ? `Insufficient ${quoteToken?.symbol || quoteToken?.address} balance`
      : undefined
  const amountIsValid = !!amountRaw && !amountBelowMinimum && !insufficientBalance && !walletBalanceLoading

  const currentFunding = useRef({ quoteToken, amountRaw })
  currentFunding.current = { quoteToken, amountRaw }
  const validatePreparation = (action: PreparedAction): PreparedAction => {
    if (
      action.status !== 'PREPARED_ACTION_STATUS_READY' &&
      action.status !== 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED' &&
      action.reason !== 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'
    )
      return action
    const preview = action.startCopy ? 'startCopy' : 'addCapital'
    const data = action[preview]
    const current = currentFunding.current
    try {
      if (!current.amountRaw || Number(action.chainId) !== Number(current.quoteToken?.chainId)) {
        throw new Error(FUNDING_TOKEN_CHANGED)
      }
      const preparedAmount = action.startCopy?.requestedTargetRaw ?? action.addCapital?.addedCapitalRaw
      if (preparedAmount !== current.amountRaw) throw new Error('Review the amount and prepare again.')
      const token = resolveFundingToken(data?.quoteToken, current.quoteToken)
      return { ...action, [preview]: { ...data, quoteToken: token } }
    } catch (error) {
      void refreshChains()
      throw error
    }
  }

  const onExpectedChain = connectedChainId === targetChainId
  const presetsEnabled = !!account && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : '0'

  const getPreset = (percentage: CapitalPercentage) => presetAmounts?.find(item => item.percentage === percentage)

  return {
    amount,
    amountError,
    chainsLoading,
    refreshChains,
    validatePreparation,
    amountIsValid,
    amountRaw,
    getPreset,
    onExpectedChain,
    presetAmounts,
    presetsEnabled,
    quoteCurrency,
    quoteToken,
    tokenKey,
    setAmount,
    walletBalanceLoading,
    walletBalanceText,
  }
}
