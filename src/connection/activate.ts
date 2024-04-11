import { ChainId } from '@kyberswap/ks-sdk-core'
import { Connection, ConnectionType } from 'connection/types'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'

import { didUserReject } from './utils'

export enum ActivationStatus {
  PENDING = 'PENDING',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
}

type ActivationPendingState = { status: ActivationStatus.PENDING; connection: Connection }
type ActivationErrorState = { status: ActivationStatus.ERROR; connection: Connection; error: any }
const IDLE_ACTIVATION_STATE = { status: ActivationStatus.IDLE } as const
type ActivationState = ActivationPendingState | ActivationErrorState | typeof IDLE_ACTIVATION_STATE

const activationStateAtom = atom<ActivationState>(IDLE_ACTIVATION_STATE)

function useTryActivation() {
  const setActivationState = useUpdateAtom(activationStateAtom)

  return useCallback(
    async (connection: Connection, onSuccess: () => void, chainId?: ChainId) => {
      // Skips wallet connection if the connection should override the default
      // behavior, i.e. install MetaMask or launch Coinbase app
      if (connection.overrideActivate?.(chainId)) return

      const { name } = connection.getProviderInfo()
      try {
        setActivationState({ status: ActivationStatus.PENDING, connection })

        console.debug(`Connection activating: ${name}`)
        await connection.connector.activate(connection.type === ConnectionType.WALLET_CONNECT_V2 ? undefined : chainId)

        console.debug(`Connection activated: ${name}`)

        // Clears pending connection state
        setActivationState(IDLE_ACTIVATION_STATE)

        onSuccess()
      } catch (error) {
        // Gracefully handles errors from the user rejecting a connection attempt
        if (didUserReject(connection, error)) {
          setActivationState(IDLE_ACTIVATION_STATE)
          return
        }

        console.debug(`Connection failed: ${name}`)
        console.error(error)

        // Failed Connection events are logged here, while successful ones are logged by Web3Provider
        setActivationState({ status: ActivationStatus.ERROR, connection, error })
      }
    },
    [setActivationState],
  )
}

function useCancelActivation() {
  const setActivationState = useUpdateAtom(activationStateAtom)
  return useCallback(
    () =>
      setActivationState(activationState => {
        if (activationState.status !== ActivationStatus.IDLE) activationState.connection.connector.deactivate?.()
        return IDLE_ACTIVATION_STATE
      }),
    [setActivationState],
  )
}

export function useActivationState() {
  const activationState = useAtomValue(activationStateAtom)
  const tryActivation = useTryActivation()
  const cancelActivation = useCancelActivation()

  return { activationState, tryActivation, cancelActivation }
}
