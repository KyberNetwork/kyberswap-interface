import { getPublicClient } from '@wagmi/core'
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react'
import { useCreateWalletSessionChallengeMutation, useCreateWalletSessionMutation } from 'services/copyTrading'
import type { Address, PreparedAction, WalletSessionResponse } from 'services/copyTrading/types'

import { wagmiConfig } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import {
  type PreparedActionExpectation,
  getApiErrorMessage,
  getPreparedReasonMessage,
  getReprepareDelay,
  isRetryableApiError,
  isUnauthorizedError,
  validatePreparedAction,
  wait,
} from 'pages/CopyTrading/write/preparedAction'
import type { Hash, Hex, Address as ViemAddress } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

export type PreparedActionPhase =
  | 'idle'
  | 'preparing'
  | 'review'
  | 'awaiting_signature'
  | 'confirming'
  | 'syncing'
  | 'pending'
  | 'unavailable'
  | 'success'
  | 'error'
  | 'sync_error'

export type PreparedActionFlowState = {
  phase: PreparedActionPhase
  action?: PreparedAction
  error?: string
  hash?: Hash
  retryStage?: 'receipt' | 'sync'
}

export const DEFAULT_PREPARED_ACTION_STATE: PreparedActionFlowState = { phase: 'idle' }

export type PreparedActionReceiptOutcome = 'complete' | 'reprepare'

type UsePreparedActionProps = {
  state: PreparedActionFlowState
  setState: Dispatch<SetStateAction<PreparedActionFlowState>>
  expected: PreparedActionExpectation
  prepare: () => Promise<PreparedAction>
  afterReceipt?: (
    action: PreparedAction,
    hash: Hash,
  ) => PreparedActionReceiptOutcome | Promise<PreparedActionReceiptOutcome>
  onComplete?: () => Promise<void> | void
}

const CONTINUATION_ATTEMPTS = 6

export const usePreparedAction = ({
  state,
  setState,
  expected,
  prepare,
  afterReceipt,
  onComplete,
}: UsePreparedActionProps) => {
  const finish = (action?: PreparedAction, hash?: Hash) => {
    setState({ phase: 'success', action, hash })
    void Promise.resolve()
      .then(() => onComplete?.())
      .catch(() => undefined)
  }

  const requestPreparation = async ({ continuation = false, hash }: { continuation?: boolean; hash?: Hash } = {}) => {
    setState({ phase: continuation ? 'syncing' : 'preparing', hash })

    for (let attempt = 0; attempt < CONTINUATION_ATTEMPTS; attempt++) {
      let action: PreparedAction
      try {
        action = await prepare()
      } catch (error) {
        if (continuation && attempt < CONTINUATION_ATTEMPTS - 1 && isRetryableApiError(error)) {
          await wait(2_000)
          continue
        }

        setState({ phase: continuation ? 'sync_error' : 'error', error: getApiErrorMessage(error), hash })
        return
      }

      if (action.status === 'PREPARED_ACTION_STATUS_PENDING') {
        const validationError = validatePreparedAction(action, expected, { requireCall: false })
        if (validationError) {
          setState({ phase: 'error', action, error: validationError, hash })
          return
        }
        if (continuation && attempt < CONTINUATION_ATTEMPTS - 1) {
          await wait(getReprepareDelay(action))
          continue
        }
        setState({ phase: 'pending', action, error: getPreparedReasonMessage(action.reason), hash })
        return
      }

      if (action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE') {
        setState({ phase: 'unavailable', action, error: getPreparedReasonMessage(action.reason), hash })
        return
      }

      if (action.status === 'PREPARED_ACTION_STATUS_COMPLETED') {
        const validationError = validatePreparedAction(action, expected, { requireCall: false })
        if (validationError) {
          setState({ phase: 'error', action, error: validationError, hash })
          return
        }
        finish(action, hash)
        return
      }

      if (
        action.status !== 'PREPARED_ACTION_STATUS_READY' &&
        action.status !== 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED'
      ) {
        setState({ phase: 'error', action, error: 'The API returned an unsupported preparation status.', hash })
        return
      }

      const validationError = validatePreparedAction(action, expected)
      if (validationError) {
        setState({ phase: 'error', action, error: validationError, hash })
        return
      }

      setState({ phase: 'review', action, hash })
      return
    }
  }

  const finishReceipt = async (action: PreparedAction, hash: Hash) => {
    if (!afterReceipt) {
      finish(action, hash)
      return
    }

    try {
      const outcome = await afterReceipt(action, hash)
      if (outcome === 'reprepare') {
        await requestPreparation({ continuation: true, hash })
        return
      }
      finish(action, hash)
    } catch (error) {
      setState({
        phase: 'sync_error',
        action,
        error: getApiErrorMessage(error),
        hash,
        retryStage: 'sync',
      })
    }
  }

  const confirm = async () => {
    const action = state.action
    const call = action?.call
    if (!action || !call?.to || !call.data) {
      setState({ phase: 'error', action, error: 'The prepared call is missing. Prepare the action again.' })
      return
    }

    const validationError = validatePreparedAction(action, expected)
    if (validationError) {
      setState({ phase: 'error', action, error: validationError })
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

      await finishReceipt(action, submittedHash)
    } catch (error) {
      setState({
        phase: hash ? 'sync_error' : 'error',
        action,
        error: hash
          ? `The transaction was submitted, but its receipt could not be confirmed. ${getApiErrorMessage(error)}`
          : getApiErrorMessage(error),
        hash,
        retryStage: hash ? 'receipt' : undefined,
      })
    }
  }

  const retry = async () => {
    if (state.phase === 'sync_error' && state.action && state.hash) {
      if (state.retryStage === 'receipt') {
        setState({ phase: 'confirming', action: state.action, hash: state.hash })
        try {
          const publicClient = getPublicClient(wagmiConfig, { chainId: expected.chainId })
          if (!publicClient) throw new Error('The public client is unavailable for the selected chain.')
          const receipt = await publicClient.waitForTransactionReceipt({ hash: state.hash })
          if (receipt.status !== 'success') {
            setState({
              phase: 'error',
              action: state.action,
              error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
              hash: state.hash,
            })
            return
          }
          await finishReceipt(state.action, state.hash)
        } catch (error) {
          setState({
            phase: 'sync_error',
            action: state.action,
            error: getApiErrorMessage(error),
            hash: state.hash,
            retryStage: 'receipt',
          })
        }
        return
      }

      await finishReceipt(state.action, state.hash)
      return
    }

    if (state.phase === 'pending' && state.action) {
      setState({ phase: 'preparing', action: state.action, hash: state.hash })
      await wait(getReprepareDelay(state.action))
    }

    await requestPreparation({ hash: state.hash })
  }

  const reset = () => setState(DEFAULT_PREPARED_ACTION_STATE)

  return { confirm, prepare: requestPreparation, reset, retry }
}

type WalletSession = WalletSessionResponse['data']

export const useCopyTradingWalletSession = () => {
  const { account, chainId: activeChainId } = useActiveWeb3React()
  const [session, setSession] = useState<WalletSession>()
  const [createChallenge] = useCreateWalletSessionChallengeMutation()
  const [createSession] = useCreateWalletSessionMutation()

  const clear = useCallback(() => setSession(undefined), [])

  useEffect(() => {
    clear()
  }, [account, activeChainId, clear])

  const getAccessToken = useCallback(
    async (ownerAddress: Address, chainId: number, force = false) => {
      const validUntil = session?.expiresAt ? Date.parse(session.expiresAt) : 0
      if (
        !force &&
        session?.accessToken &&
        session.ownerAddress.toLowerCase() === ownerAddress.toLowerCase() &&
        Number(session.chainId) === chainId &&
        validUntil > Date.now() + 30_000
      ) {
        return session.accessToken
      }

      const challenge = await createChallenge({ chainId: String(chainId), ownerAddress }).unwrap()
      const walletClient = await getGatedWalletClient({ chainId })
      if (!walletClient) throw new Error('Wallet client is unavailable for authorization.')

      const signature = await walletClient.signMessage({
        account: ownerAddress,
        message: challenge.data.siweMessage,
      })
      const response = await createSession({
        challengeToken: challenge.data.challengeToken,
        signature,
      }).unwrap()
      const nextSession = response.data

      if (
        nextSession.tokenType !== 'Bearer' ||
        nextSession.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase() ||
        Number(nextSession.chainId) !== chainId ||
        Date.parse(nextSession.expiresAt) <= Date.now()
      ) {
        throw new Error('The wallet session response does not match the selected wallet and chain.')
      }

      setSession(nextSession)
      return nextSession.accessToken
    },
    [createChallenge, createSession, session],
  )

  const withAccessToken = useCallback(
    async <T>(ownerAddress: Address, chainId: number, request: (accessToken: string) => Promise<T>) => {
      let accessToken = await getAccessToken(ownerAddress, chainId)
      try {
        return await request(accessToken)
      } catch (error) {
        if (!isUnauthorizedError(error)) throw error
        clear()
        accessToken = await getAccessToken(ownerAddress, chainId, true)
        return request(accessToken)
      }
    },
    [clear, getAccessToken],
  )

  return { clear, withAccessToken }
}
