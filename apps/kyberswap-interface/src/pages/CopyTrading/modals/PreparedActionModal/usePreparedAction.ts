import { getPublicClient } from '@wagmi/core'
import { useRef, useState } from 'react'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { SubmittedActionStatusData } from 'services/copyTrading/types/actionStatus'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { wagmiConfig } from 'components/Web3Provider'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import {
  SubmittedActionFailedError,
  pollSubmittedActionStatus,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  type PreparedActionExpectation,
  getApiErrorMessage,
  getReprepareDelay,
  isPreparationExpiredError,
  validatePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  type PreparationRequestOptions,
  requestPreparation,
} from 'pages/CopyTrading/modals/PreparedActionModal/requestPreparation'
import { useGenerationPolicy } from 'pages/CopyTrading/modals/PreparedActionModal/useGenerationPolicy'
import type { Hash, Hex, Address as ViemAddress } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

type UsePreparedActionProps = {
  getExpected: () => PreparedActionExpectation
  prepare: () => Promise<PreparedAction>
  reviewUnavailable?: (action: PreparedAction) => boolean
  onPrepared?: (action: PreparedAction) => void
  onSubmittedSuccess?: (
    result: NonNullable<SubmittedActionStatusData['result']>,
    action: PreparedAction,
  ) => Promise<void> | void
}

export const usePreparedAction = ({
  getExpected,
  prepare,
  reviewUnavailable,
  onPrepared,
  onSubmittedSuccess,
}: UsePreparedActionProps) => {
  const [state, setState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const preparationVersion = useRef(0)
  const validateGenerationPolicy = useGenerationPolicy(getExpected().preview)
  const [getStatus] = preparedActionApi.useGetSubmittedActionStatusMutation()
  const refreshCopyTrading = useRefreshCopyTrading()
  const refresh = () => {
    try {
      void Promise.resolve(refreshCopyTrading()).catch(() => undefined)
    } catch {}
  }

  const requestPreparedAction = (options?: PreparationRequestOptions, prepareAction = prepare) => {
    const version = ++preparationVersion.current
    const isCurrent = () => version === preparationVersion.current
    return requestPreparation(
      {
        getExpected,
        isCurrent,
        finish: action => {
          refresh()
          if (isCurrent()) setState({ phase: 'success', action })
        },
        prepare: async () => {
          const action = await prepareAction()
          if (
            action.status === 'PREPARED_ACTION_STATUS_READY' ||
            action.status === 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED' ||
            reviewUnavailable?.(action)
          )
            await validateGenerationPolicy(action)
          return action
        },
        reviewUnavailable,
        onPrepared,
        setState,
      },
      options,
    )
  }

  const syncSubmittedAction = async (action: PreparedAction, hash: Hash) => {
    setState({ phase: 'syncing', action, hash })
    // Refresh once on receipt and again when the API reports a successful transaction outcome.
    refresh()

    try {
      const status = await pollSubmittedActionStatus({ action, hash, getStatus })
      refresh()
      if (status.result) await onSubmittedSuccess?.(status.result, action)
      setState({ phase: 'success', action, hash })
    } catch (error) {
      setState({
        phase: error instanceof SubmittedActionFailedError ? 'error' : 'sync_error',
        action,
        error: getApiErrorMessage(error),
        hash,
        retryStage: error instanceof SubmittedActionFailedError ? undefined : 'sync',
      })
    }
  }

  const confirmPreparedAction = async (preparedAction?: PreparedAction) => {
    preparationVersion.current += 1
    const action = preparedAction || state.action
    const call = action?.call
    if (!action || !call?.to || !call.data) {
      setState({ phase: 'error', action, error: 'The prepared call is missing. Prepare the action again.' })
      return
    }

    const expected = getExpected()
    const validationError = validatePreparedAction(action, expected)
    if (validationError) {
      setState({
        phase: isPreparationExpiredError(validationError) ? 'expired' : 'error',
        action,
        error: validationError,
      })
      return
    }

    let hash: Hash | undefined
    try {
      setState({ phase: 'awaiting_signature', action })
      await validateGenerationPolicy(action)
      const publicClient = getPublicClient(wagmiConfig, { chainId: expected.chainId })
      const walletClient = await getGatedWalletClient({ chainId: expected.chainId })
      if (!publicClient || !walletClient) throw new Error('Wallet client is unavailable for the selected chain.')

      const value = BigInt(call.valueRaw || '0')
      await publicClient.call({
        account: expected.account as ViemAddress,
        to: call.to as ViemAddress,
        data: call.data as Hex,
        value,
      })

      const gas =
        expected.preview === 'withdrawTokens'
          ? await publicClient.estimateGas({
              account: expected.account as ViemAddress,
              to: call.to as ViemAddress,
              data: call.data as Hex,
              value,
            })
          : undefined

      const submittedHash = await walletClient.sendTransaction({
        account: expected.account as ViemAddress,
        chain: undefined,
        ...(gas === undefined ? {} : { gas }),
        to: call.to as ViemAddress,
        data: call.data as Hex,
        value,
      })
      hash = submittedHash

      setState({ phase: 'confirming', action, hash: submittedHash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash: submittedHash })
      hash = receipt.transactionHash
      if (receipt.status !== 'success') {
        setState({
          phase: 'error',
          action,
          error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
          hash,
        })
        return
      }

      await syncSubmittedAction(action, receipt.transactionHash)
    } catch (error) {
      setState({
        phase: hash ? 'sync_error' : 'error',
        action,
        error: hash
          ? 'The transaction was submitted, but its receipt could not be confirmed. ' + getApiErrorMessage(error)
          : getApiErrorMessage(error),
        hash,
        retryStage: hash ? 'receipt' : undefined,
      })
    }
  }

  const confirm = () => confirmPreparedAction()
  const prepareAndConfirm = () => requestPreparedAction({ onReady: confirmPreparedAction })

  const retryReceipt = async (action: PreparedAction, hash: Hash) => {
    const expected = getExpected()
    setState({ phase: 'confirming', action, hash })

    try {
      const publicClient = getPublicClient(wagmiConfig, { chainId: expected.chainId })
      if (!publicClient) throw new Error('The public client is unavailable for the selected chain.')

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') {
        setState({
          phase: 'error',
          action,
          error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
          hash: receipt.transactionHash,
        })
        return
      }

      await syncSubmittedAction(action, receipt.transactionHash)
    } catch (error) {
      setState({
        phase: 'sync_error',
        action,
        error: getApiErrorMessage(error),
        hash,
        retryStage: 'receipt',
      })
    }
  }

  const retryPreparedAction = async (onReady?: (action: PreparedAction) => Promise<void> | void) => {
    if (state.phase === 'sync_error' && state.action && state.hash) {
      if (state.retryStage === 'receipt') {
        await retryReceipt(state.action, state.hash)
        return
      }

      await syncSubmittedAction(state.action, state.hash)
      return
    }

    await requestPreparedAction({
      delay: state.phase === 'pending' && state.action ? getReprepareDelay(state.action) : 0,
      onReady,
      phaseWhilePreparing: !onReady && (state.phase === 'expired' || state.phase === 'error') ? 'review' : undefined,
    })
  }

  const retry = () => retryPreparedAction()
  const retryAndConfirm = () => retryPreparedAction(confirmPreparedAction)

  const reset = () => {
    preparationVersion.current += 1
    setState(DEFAULT_PREPARED_ACTION_STATE)
  }

  const fail = (error: unknown, action = state.action) => {
    setState({ phase: 'error', action, error: getApiErrorMessage(error) })
  }

  return {
    state,
    fail,
    confirm,
    prepare: (prepareAction = prepare) => requestPreparedAction(undefined, prepareAction),
    prepareAndConfirm,
    reset,
    retry,
    retryAndConfirm,
    validateGenerationPolicy,
  }
}
