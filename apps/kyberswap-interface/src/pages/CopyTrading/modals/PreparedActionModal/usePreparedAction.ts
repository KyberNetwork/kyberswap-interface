import { getPublicClient } from '@wagmi/core'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { wagmiConfig } from 'components/Web3Provider'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  type PreparedActionExpectation,
  type PreparedActionFlowState,
  type PreparedActionStateSetter,
  getApiErrorMessage,
  getReprepareDelay,
  invalidatePreparationRequests,
  isCurrentPreparationRequest,
  isPreparationExpiredError,
  validatePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  type PreparationRequestOptions,
  requestPreparation,
} from 'pages/CopyTrading/modals/PreparedActionModal/requestPreparation'
import type { Hash, Hex, Address as ViemAddress } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

type UsePreparedActionProps = {
  state: PreparedActionFlowState
  setState: PreparedActionStateSetter
  expected: PreparedActionExpectation
  prepare: () => Promise<PreparedAction>
  reviewUnavailable?: (action: PreparedAction) => boolean
  afterReceipt?: (action: PreparedAction, hash: Hash, receiptBlockNumber?: bigint) => Promise<void> | void
  onComplete?: () => Promise<void> | void
}

export const usePreparedAction = ({
  state,
  setState,
  expected,
  prepare,
  reviewUnavailable,
  afterReceipt,
  onComplete,
}: UsePreparedActionProps) => {
  const notifyComplete = () => {
    try {
      void Promise.resolve(onComplete?.()).catch(() => undefined)
    } catch {}
  }

  const finish = (action?: PreparedAction, hash?: Hash, preparationVersion?: number, shouldNotifyComplete = true) => {
    if (preparationVersion !== undefined && !isCurrentPreparationRequest(setState, preparationVersion)) {
      return
    }
    if (shouldNotifyComplete) notifyComplete()
    if (preparationVersion !== undefined && !isCurrentPreparationRequest(setState, preparationVersion)) {
      return
    }

    setState({ phase: 'success', action, hash })
  }

  const requestPreparedAction = (options?: PreparationRequestOptions) =>
    requestPreparation(
      {
        expected,
        finish,
        prepare,
        reviewUnavailable,
        setState,
      },
      options,
    )

  const finishReceipt = async (action: PreparedAction, hash: Hash, receiptBlockNumber?: bigint) => {
    const receiptState = receiptBlockNumber === undefined ? {} : { receiptBlockNumber }
    setState({ phase: 'syncing', action, hash, ...receiptState })
    notifyComplete()

    if (!afterReceipt) {
      finish(action, hash, undefined, false)
      return
    }

    try {
      await afterReceipt(action, hash, receiptBlockNumber)
      finish(action, hash, undefined, false)
    } catch (error) {
      setState({
        phase: 'sync_error',
        action,
        error: getApiErrorMessage(error),
        hash,
        ...receiptState,
        retryStage: 'sync',
      })
    }
  }

  const confirmPreparedAction = async (preparedAction?: PreparedAction) => {
    invalidatePreparationRequests(setState)
    const action = preparedAction || state.action
    const call = action?.call
    if (!action || !call?.to || !call.data) {
      setState({ phase: 'error', action, error: 'The prepared call is missing. Prepare the action again.' })
      return
    }

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

      const submittedHash = await walletClient.sendTransaction({
        account: expected.account as ViemAddress,
        chain: undefined,
        to: call.to as ViemAddress,
        data: call.data as Hex,
        value,
      })
      hash = submittedHash

      setState({ phase: 'confirming', action, hash: submittedHash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash: submittedHash })
      if (receipt.status !== 'success') {
        setState({
          phase: 'error',
          action,
          error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
          hash: submittedHash,
        })
        return
      }

      await finishReceipt(action, submittedHash, receipt.blockNumber)
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
          hash,
        })
        return
      }

      await finishReceipt(action, hash, receipt.blockNumber)
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

      await finishReceipt(state.action, state.hash, state.receiptBlockNumber)
      return
    }

    const continuation = state.phase === 'pending' && !!state.hash
    await requestPreparedAction({
      continuation,
      delay: state.phase === 'pending' && state.action ? getReprepareDelay(state.action) : 0,
      hash: continuation ? state.hash : undefined,
      onReady: continuation ? undefined : onReady,
      phaseWhilePreparing: !onReady && (state.phase === 'expired' || state.phase === 'error') ? 'review' : undefined,
    })
  }

  const retry = () => retryPreparedAction()
  const retryAndConfirm = () => retryPreparedAction(confirmPreparedAction)

  const reset = () => {
    invalidatePreparationRequests(setState)
    setState(DEFAULT_PREPARED_ACTION_STATE)
  }

  return { confirm, prepare: requestPreparedAction, prepareAndConfirm, reset, retry, retryAndConfirm }
}
