import { CHAIN_ID_TO_CHAIN } from '@kyber/schema'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { useBuildSwapRouteMutation, useGetSwapRouteQuery } from 'services/zap'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useDebounce from 'hooks/useDebounce'
import { submitTransaction } from 'pages/Earns/utils'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'

const ROUTE_DEADLINE_SECONDS = 20 * 60

type UseZapSwapArgs = {
  chainId: number
  /** Aggregator token addresses; native is the `0xEeee…` placeholder. */
  tokenInAddress?: string
  tokenOutAddress?: string
  /** Amount to spend, in raw units. */
  amountInRaw?: string
  /** Same amount as a currency, for the allowance check. */
  approvalAmount?: CurrencyAmount<Currency>
  /** Slippage in basis points. */
  slippage: number
  transactionType: TRANSACTION_TYPE
  /** Called with the built route's quoted output, in raw units, to describe the transaction. */
  buildExtraInfo?: (quoteAmountOutRaw: string) => TransactionExtraInfo
  errorTitle: string
  /** Hold the quote steady while the user is reviewing or signing it. */
  pausePolling?: boolean
}

/**
 * One aggregator route and the transaction that executes it. Vault deposits swap into the share
 * token and withdrawals to another token swap out of it, so both run through here.
 */
export const useZapSwap = ({
  chainId,
  tokenInAddress,
  tokenOutAddress,
  amountInRaw,
  approvalAmount,
  slippage,
  transactionType,
  buildExtraInfo,
  errorTitle,
  pausePolling,
}: UseZapSwapArgs) => {
  const { account } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const [buildSwapRoute] = useBuildSwapRouteMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const debouncedAmount = useDebounce(amountInRaw, 400)

  const routeParams = useMemo(() => {
    if (!tokenInAddress || !tokenOutAddress || !debouncedAmount || debouncedAmount === '0') return undefined
    return new URLSearchParams({
      tokens_in: tokenInAddress,
      amounts_in: debouncedAmount,
      token_out: tokenOutAddress,
      slippage: String(slippage),
    }).toString()
  }, [tokenInAddress, tokenOutAddress, debouncedAmount, slippage])

  const {
    data: routeResponse,
    isFetching: isRouteLoading,
    error: routeQueryError,
    refetch: refetchRoute,
  } = useGetSwapRouteQuery(
    { chainName: CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN], params: routeParams || '' },
    { skip: !routeParams, pollingInterval: pausePolling ? 0 : 15_000 },
  )

  const route = routeResponse?.data
  /** The amount is debounced before it reaches the query, so between a keystroke and the next quote
   *  the cached route belongs to a different amount. Acting on it would send one amount while the
   *  summary shows another. A background poll re-fetching the same amount leaves the cached route
   *  valid, so it does not count as stale. */
  const isRouteStale = amountInRaw !== debouncedAmount

  // The endpoint answers `message: "OK"` on success, so only a missing route counts as an error.
  const routeError = routeQueryError
    ? t`Could not find a route for this token.`
    : routeResponse && !route
    ? routeResponse.message || t`Could not find a route for this token.`
    : undefined

  /** What the route delivers, summed over its swaps into the output token. */
  const amountOutRaw = useMemo(() => {
    if (!route || !tokenOutAddress) return undefined
    const target = tokenOutAddress.toLowerCase()
    const total = route.zapDetails.actions
      .flatMap(action => action.aggregatorSwap?.swaps || [])
      .filter(swap => swap.tokenOut.address.toLowerCase() === target)
      .reduce((sum, swap) => sum + safeBigInt(swap.tokenOut.amount), 0n)
    return total > 0n ? total : undefined
  }, [route, tokenOutAddress])

  /** Worst case at the slippage the route was quoted with. */
  const minAmountOutRaw = useMemo(
    () => (amountOutRaw === undefined ? undefined : (amountOutRaw * BigInt(10000 - slippage)) / 10000n),
    [amountOutRaw, slippage],
  )

  // The approve step re-reads the allowance on chain before prompting, so the cached state must not
  // be the thing that decides whether a prompt is shown.
  const [approvalState, approve] = useApproveCallback({
    amount: approvalAmount,
    spender: route?.allowanceHubAddress,
    forceApprove: true,
  })

  /** Returns the transaction hash so a step sequence can wait for its receipt. */
  const submit = useCallback(async (): Promise<string | undefined> => {
    if (!account || !route) return undefined

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const built = await buildSwapRoute({
        chainName: CHAIN_ID_TO_CHAIN[chainId as keyof typeof CHAIN_ID_TO_CHAIN],
        sender: account,
        recipient: account,
        route: route.route,
        deadline: Math.floor(Date.now() / 1000) + ROUTE_DEADLINE_SECONDS,
        source: 'kyberswap',
      }).unwrap()

      const buildData = built.data
      if (!buildData?.callData) throw new Error(built.message || 'Failed to build the transaction')

      const { txHash: hash, error } = await submitTransaction({
        account,
        chainId: chainId as ChainId,
        txData: { to: buildData.routerAddress, data: buildData.callData, value: buildData.value },
        isSmartConnector,
      })

      if (error || !hash) throw error || new Error('Transaction was not submitted')

      setTxHash(hash)
      addTransactionWithType({
        hash,
        type: transactionType,
        extraInfo: buildExtraInfo?.(buildData.quoteAmountOut || '0'),
      })
      return hash
    } catch (error) {
      const message = friendlyError(error as Error)
      setSubmitError(message)
      notify({ title: errorTitle, summary: message, type: NotificationType.ERROR }, 8000)
      return undefined
    } finally {
      setIsSubmitting(false)
    }
  }, [
    account,
    route,
    buildSwapRoute,
    chainId,
    isSmartConnector,
    addTransactionWithType,
    transactionType,
    buildExtraInfo,
    notify,
    errorTitle,
  ])

  const reset = useCallback(() => {
    setSubmitError(null)
    setTxHash(null)
  }, [])

  return {
    route,
    amountOutRaw,
    minAmountOutRaw,
    routeError,
    isRouteLoading,
    isRouteStale,
    refetchRoute,
    approvalState,
    approve,
    needsApproval: approvalState === ApprovalState.NOT_APPROVED,
    submit,
    isSubmitting,
    submitError,
    txHash,
    reset,
  }
}
