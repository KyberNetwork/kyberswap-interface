import { useCallback, useState } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { COPY_TRADE_MOCK_WRITE } from 'pages/CopyTrading/write/config'
import { submitTransaction } from 'pages/Earns/utils'

export type CopyTxState = 'idle' | 'pending' | 'submitted' | 'confirmed' | 'error'

export type CopyTxRequest = {
  to: string
  data: string
  value?: bigint
}

/** One on-chain step. `build` returns the calldata; multiple steps run sequentially. */
export type CopyTxStep = {
  label: string
  build: () => Promise<CopyTxRequest> | CopyTxRequest
}

export type CopyTxStatus = {
  state: CopyTxState
  hash?: string
  error?: string
  /** 1-based index of the step currently executing. */
  stepIndex: number
  stepCount: number
  stepLabel?: string
}

const INITIAL: CopyTxStatus = { state: 'idle', stepIndex: 0, stepCount: 0 }

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockHash = () => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

export const useCopyTradeTx = () => {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const [status, setStatus] = useState<CopyTxStatus>(INITIAL)

  const reset = useCallback(() => setStatus(INITIAL), [])

  const run = useCallback(
    async (steps: CopyTxStep[]): Promise<boolean> => {
      if (!steps.length) return false

      setStatus({ state: 'pending', stepIndex: 1, stepCount: steps.length, stepLabel: steps[0].label })

      let lastHash: string | undefined

      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          setStatus({ state: 'pending', stepIndex: i + 1, stepCount: steps.length, stepLabel: step.label })

          if (COPY_TRADE_MOCK_WRITE) {
            await wait(900)
            lastHash = mockHash()
          } else {
            // Advances once the tx is broadcast. Dependent multi-step flows
            // (e.g. create wallet → deposit) need a receipt wait added here
            // before the next step when the real path is enabled.
            const tx = await step.build()
            const { txHash, error } = await submitTransaction({
              account,
              chainId,
              txData: { to: tx.to, data: tx.data, value: tx.value?.toString() },
              isSmartConnector,
            })
            if (error || !txHash) throw error || new Error('Transaction failed')
            lastHash = txHash
          }

          setStatus({
            state: 'submitted',
            hash: lastHash,
            stepIndex: i + 1,
            stepCount: steps.length,
            stepLabel: step.label,
          })
          if (COPY_TRADE_MOCK_WRITE) await wait(700)
        }

        setStatus({ state: 'confirmed', hash: lastHash, stepIndex: steps.length, stepCount: steps.length })
        return true
      } catch (error) {
        setStatus({
          state: 'error',
          hash: lastHash,
          stepCount: steps.length,
          stepIndex: 0,
          error: error instanceof Error ? error.message : 'Transaction failed',
        })
        return false
      }
    },
    [account, chainId, isSmartConnector],
  )

  return { status, run, reset }
}
