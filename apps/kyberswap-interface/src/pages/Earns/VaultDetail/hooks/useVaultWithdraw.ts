import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { VaultWithdrawRequest } from 'services/vault'

import { NotificationType } from 'components/Announcement/type'
import BORING_ON_CHAIN_QUEUE_ABI from 'constants/abis/earn/boringOnChainQueue.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { submitTransaction } from 'pages/Earns/utils'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'
import { Abi, Address, encodeFunctionData, formatUnits } from 'utils/viem'

type UseVaultWithdrawArgs = {
  chainId: number
  queueAddress?: string
  shareToken?: Token
  /** Shares to withdraw, in raw units. */
  shares?: bigint
  assetOut?: string
  /** Basis points given up to incentivise a solver; the queue's minimum by default. */
  discount?: number
  secondsToDeadline?: number
}

export const useVaultWithdraw = ({
  chainId,
  queueAddress,
  shareToken,
  shares,
  assetOut,
  discount,
  secondsToDeadline,
}: UseVaultWithdrawArgs) => {
  const { account } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // The queue pulls the shares itself, so the approval is on the share token, not the vault.
  const approvalAmount = useMemo<CurrencyAmount<Currency> | undefined>(
    () =>
      shareToken && shares && shares > 0n ? CurrencyAmount.fromRawAmount(shareToken, shares.toString()) : undefined,
    [shareToken, shares],
  )

  // The approve step re-reads the allowance on chain before prompting, so the cached state must not
  // be the thing that decides whether a prompt is shown.
  const [approvalState, approve] = useApproveCallback({
    amount: approvalAmount,
    spender: queueAddress,
    forceApprove: true,
  })

  const reset = useCallback(() => {
    setSubmitError(null)
    setTxHash(null)
  }, [])

  /** Returns the transaction hash so a step sequence can wait for its receipt. */
  const requestWithdraw = useCallback(async (): Promise<string | undefined> => {
    if (!account || !queueAddress || !assetOut || !shares || shares <= 0n) return undefined
    if (discount === undefined || secondsToDeadline === undefined) return undefined

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const data = encodeFunctionData({
        abi: BORING_ON_CHAIN_QUEUE_ABI as Abi,
        functionName: 'requestOnChainWithdraw',
        args: [assetOut as Address, shares, discount, secondsToDeadline],
      })

      const { txHash: hash, error } = await submitTransaction({
        account,
        chainId: chainId as ChainId,
        txData: { to: queueAddress, data, value: '0' },
        isSmartConnector,
      })

      if (error || !hash) throw error || new Error('Transaction was not submitted')

      setTxHash(hash)
      addTransactionWithType({
        hash,
        type: TRANSACTION_TYPE.EARN_VAULT_WITHDRAW_REQUEST,
        extraInfo: {
          tokenAddress: shareToken?.address ?? '',
          tokenSymbol: shareToken?.symbol ?? '',
          tokenAmount: approvalAmount?.toSignificant(6) ?? '',
          contract: queueAddress,
        },
      })
      return hash
    } catch (error) {
      const message = friendlyError(error as Error)
      setSubmitError(message)
      notify({ title: t`Withdrawal request failed`, summary: message, type: NotificationType.ERROR }, 8000)
      return undefined
    } finally {
      setIsSubmitting(false)
    }
  }, [
    account,
    queueAddress,
    assetOut,
    shares,
    discount,
    secondsToDeadline,
    chainId,
    isSmartConnector,
    addTransactionWithType,
    shareToken?.address,
    shareToken?.symbol,
    approvalAmount,
    notify,
  ])

  return {
    approvalState,
    approve,
    needsApproval: approvalState === ApprovalState.NOT_APPROVED,
    requestWithdraw,
    isSubmitting,
    submitError,
    txHash,
    reset,
  }
}

/**
 * Cancelling returns the shares the queue is holding. The queue only stores `keccak256(request)`,
 * so the whole struct has to be sent back exactly as it was emitted — any drift and the contract
 * cannot find the request.
 */
export const useCancelWithdrawRequest = ({
  chainId,
  shareSymbol,
  shareDecimals,
  onSubmitted,
}: {
  chainId: number
  shareSymbol: string
  shareDecimals: number
  onSubmitted?: () => void
}) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null)

  const cancelRequest = useCallback(
    async (request: VaultWithdrawRequest) => {
      if (!account) return
      // The request lives on the vault's chain; signing from another one would hit a queue that has
      // never heard of it.
      if (walletChainId !== chainId) {
        await changeNetwork(chainId as ChainId)
        return
      }

      setCancellingRequestId(request.requestId)

      try {
        const data = encodeFunctionData({
          abi: BORING_ON_CHAIN_QUEUE_ABI as Abi,
          functionName: 'cancelOnChainWithdraw',
          args: [
            {
              nonce: BigInt(request.nonce),
              user: request.user as Address,
              assetOut: request.assetOut.address as Address,
              amountOfShares: BigInt(request.amountOfShares),
              amountOfAssets: BigInt(request.amountOfAssets),
              creationTime: BigInt(request.creationTime),
              secondsToMaturity: request.secondsToMaturity,
              secondsToDeadline: request.secondsToDeadline,
            },
          ],
        })

        const { txHash: hash, error } = await submitTransaction({
          account,
          chainId: chainId as ChainId,
          txData: { to: request.queueAddress, data, value: '0' },
          isSmartConnector,
        })

        if (error || !hash) throw error || new Error('Transaction was not submitted')

        addTransactionWithType({
          hash,
          type: TRANSACTION_TYPE.EARN_VAULT_WITHDRAW_CANCEL,
          // Cancelling returns shares rather than spending them, so this is described in words —
          // the shared token-amount renderers would print it as an outflow.
          extraInfo: {
            summary: `${formatUnits(safeBigInt(request.amountOfShares), shareDecimals)} ${shareSymbol}`,
            contract: request.queueAddress,
          },
        })
        onSubmitted?.()
      } catch (error) {
        notify(
          { title: t`Cancellation failed`, summary: friendlyError(error as Error), type: NotificationType.ERROR },
          8000,
        )
      } finally {
        setCancellingRequestId(null)
      }
    },
    [
      account,
      walletChainId,
      chainId,
      changeNetwork,
      isSmartConnector,
      addTransactionWithType,
      shareSymbol,
      shareDecimals,
      onSubmitted,
      notify,
    ],
  )

  return { cancelRequest, cancellingRequestId }
}
