import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/useTokens'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import {
  hasWithdrawalBalanceConverged,
  pollCopyTradingProjection,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  parsePreparedAmount,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import {
  UINT256_MAX_RAW,
  getWithdrawAmountError,
  getWithdrawPresetAmountRaw,
  getWithdrawRequestAmountRaw,
  validateWithdrawPreview,
} from 'pages/CopyTrading/modals/WithdrawModal/utils'
import { getCopyRunOwnershipMessage, getWriteAvailabilityMessage } from 'pages/CopyTrading/modals/writeAction'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits, parseUnits } from 'utils/viem'

import type { WithdrawalInventory } from './useWithdrawalData'

type WithdrawQuoteParams = {
  isOpen: boolean
  copyRun: CopyRunListItem
  wallet: WithdrawalInventory
}

const WITHDRAW_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_WITHDRAW_QUOTE']

export const useWithdrawQuote = ({ isOpen, copyRun, wallet }: WithdrawQuoteParams) => {
  const { account } = useActiveWeb3React()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareWithdrawQuote] = preparedActionApi.usePrepareWithdrawQuoteMutation()
  const [getWalletInventory] = copyAccountApi.useLazyGetCopyAccountWalletInventoryQuery()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [amount, setAmount] = useState('')
  const [withdrawAll, setWithdrawAll] = useState(false)
  const amountInitialized = useRef(false)

  const ownershipMessage = getCopyRunOwnershipMessage(copyRun.ownerAddress, account)
  const availabilityMessage = getWriteAvailabilityMessage(copyRun.withdrawQuoteAvailability, ownershipMessage)
  const { quoteToken, stable: quoteBalance } = wallet
  const tokenServiceCurrency = useCurrencyV2(quoteToken?.address, copyRun.chainId as ChainId)
  const quoteCurrency = useMemo(() => {
    if (tokenServiceCurrency?.isToken) return tokenServiceCurrency
    if (!quoteToken) return undefined
    return new Token(copyRun.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
  }, [copyRun.chainId, quoteToken, tokenServiceCurrency])

  const walletBalanceRaw = useMemo(() => {
    if (!quoteBalance?.amountDecimal || !quoteToken) return undefined
    try {
      return parseUnits(quoteBalance.amountDecimal, quoteToken.decimals).toString()
    } catch {
      return undefined
    }
  }, [quoteBalance?.amountDecimal, quoteToken])
  useEffect(() => {
    if (!isOpen || amountInitialized.current || walletBalanceRaw === undefined || !quoteToken) return
    amountInitialized.current = true
    setAmount(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals))
    setWithdrawAll(true)
  }, [isOpen, walletBalanceRaw, quoteToken])

  const amountRaw = useMemo(() => {
    if (!quoteToken) return undefined
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])
  const amountError = getWithdrawAmountError({
    amount,
    amountRaw,
    hasQuoteCurrency: !!quoteCurrency,
    walletBalanceRaw,
    withdrawAll,
  })
  const amountIsValid =
    !!amountRaw &&
    BigInt(amountRaw) < BigInt(UINT256_MAX_RAW) &&
    !amountError &&
    (!withdrawAll || (!!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n))
  const requestAmountRaw = getWithdrawRequestAmountRaw(amountRaw, withdrawAll)
  const presetsEnabled = !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n && !!quoteToken
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : '0'

  const amountNumber = Number(amount)
  const balanceNumber = Number(quoteBalance?.amountDecimal)
  const selectedValueUsd =
    quoteBalance?.valueUsd !== undefined &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    balanceNumber > 0 &&
    amountNumber <= balanceNumber
      ? String((Number(quoteBalance.valueUsd) * amountNumber) / balanceNumber)
      : undefined

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: WITHDRAW_CALL_KINDS,
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      preview: 'withdrawQuote',
    },
    prepare: async () => {
      if (!account) throw new Error('Connect your wallet first.')
      if (ownershipMessage) throw new Error(ownershipMessage)
      if (!requestAmountRaw) throw new Error('Enter a valid withdrawal amount.')
      const response = await prepareWithdrawQuote({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        amountRaw: requestAmountRaw,
      }).unwrap()
      if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
        const validationError = validateWithdrawPreview({
          amountRaw: requestAmountRaw,
          expectedQuoteToken: quoteToken ? { address: quoteToken.address, decimals: quoteToken.decimals } : undefined,
          ownerAddress: account,
          preview: response.data.withdrawQuote,
        })
        if (validationError) throw new Error(validationError)
      }
      return response.data
    },
    afterReceipt: async (action, _hash, receiptBlockNumber) => {
      await pollCopyTradingProjection({
        errorMessage:
          'Your transaction is confirmed, but the updated quote balance is not available yet. Refresh status to try again.',
        fetch: () => getWalletInventory({ chainId: copyRun.chainId, copyAccount: copyRun.copyAccount }).unwrap(),
        isConverged: inventory =>
          hasWithdrawalBalanceConverged(inventory, receiptBlockNumber, action.withdrawQuote?.quoteToken?.address, [
            { token: action.withdrawQuote?.quoteToken, balance: action.withdrawQuote?.quoteBalance },
          ]),
      })
      refreshCopyTrading()
    },
    onComplete: refreshCopyTrading,
  })

  const setPresetAmount = (percentage: 50 | 100) => {
    if (flowState.isPreparing || !presetsEnabled || !walletBalanceRaw || !quoteToken) return
    amountInitialized.current = true
    const presetAmountRaw = getWithdrawPresetAmountRaw(walletBalanceRaw, percentage)
    setAmount(formatUnits(BigInt(presetAmountRaw), quoteToken.decimals))
    setWithdrawAll(percentage === 100)
  }

  const handleAmountChange = (value: string) => {
    amountInitialized.current = true
    setAmount(value)
    setWithdrawAll(false)
  }

  return {
    state: flowState,
    flow,
    availabilityMessage,
    executionBlocked: !!availabilityMessage || !amountIsValid,
    selectedValueUsd,
    input: {
      amount,
      amountError,
      isPreparing: flowState.isPreparing === true,
      onAmountChange: handleAmountChange,
      onHalf: () => setPresetAmount(50),
      onMax: () => setPresetAmount(100),
      presetsEnabled,
      quoteCurrency,
      selectedChainId: copyRun.chainId,
      walletBalanceLoading: wallet.loading,
      walletBalanceText,
    },
  }
}
