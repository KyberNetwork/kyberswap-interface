// import { Trans, t } from '@lingui/macro'
// import { useCallback, useMemo, useState } from 'react'

// import { useActiveWeb3React } from 'hooks/index'
// import { Field } from 'state/swap/actions'
// import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
// import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
// import { useTransactionAdder } from 'state/transactions/hooks'
// import { useUserSlippageTolerance } from 'state/user/hooks'
// import { Aggregator } from 'utils/aggregator'

// import useProvider from './solana/useProvider'
// import useSolanaAggregatorProgram from './solana/useSolanaAggregatorProgram'
// import { ApprovalState, useApproveCallbackFromTradeV2 } from './useApproveCallback'
// import { useSwapV2Callback } from './useSwapV2Callback'

// export enum StepState {
//   NOT_ACTION,
//   CALLING,
//   DONE,
// }

// export type Step = {
//   buttonTxt: string
//   action: () => any
//   state: StepState
// }

// export function useEVMSwapSteps(trade: Aggregator | undefined): Step[] {
//   const [allowedSlippage] = useUserSlippageTolerance()

//   const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)
//   const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

//   const { showConfirm, tradeToConfirm } = useSwapState()

//   const { onSetSwapState } = useSwapActionHandlers()

//   const { currencies } = useDerivedSwapInfoV2()
//   const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade)

//   // show approve flow when: no error on inputs, not approved or pending, or approved in current session
//   // never show if price impact is above threshold in non expert mode
//   const showApproveFlow =
//     approval === ApprovalState.NOT_APPROVED ||
//     approval === ApprovalState.PENDING ||
//     (approvalSubmitted && approval === ApprovalState.APPROVED)

//   const approveState =
//     approval === ApprovalState.APPROVED
//       ? StepState.DONE
//       : approval === ApprovalState.PENDING
//       ? StepState.CALLING
//       : approval === ApprovalState.NOT_APPROVED
//       ? StepState.NOT_ACTION
//       : StepState.DONE

//   const handleSwap = useCallback(() => {
//     if (!swapCallback) {
//       return
//     }
//     onSetSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
//     swapCallback()
//       .then(hash => {
//         onSetSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
//       })
//       .catch(error => {
//         onSetSwapState({
//           attemptingTxn: false,
//           tradeToConfirm,
//           showConfirm,
//           swapErrorMessage: error.message,
//           txHash: undefined,
//         })
//       })
//   }, [swapCallback, onSetSwapState, tradeToConfirm, showConfirm])

//   return [
//     { buttonTxt: t`Approve ${currencies[Field.INPUT]?.symbol}`, action: handleSwap, state: approveState },
//     { buttonTxt: t`Swap`, action: handleSwap, state: StepState.NOT_ACTION },
//   ]
// }

// export function useSolanaSwapSteps(trade: Aggregator | undefined): Step[] {
//   const { isEVM } = useActiveWeb3React()

//   return []
// }
// export function useSwapSteps(trade: Aggregator | undefined): Step[] {
//   const { isEVM, isSolana } = useActiveWeb3React()

//   const evmSteps = useEVMSwapSteps(trade)
//   const solanaSteps = useSolanaSwapSteps(trade)
//   const steps = useMemo(
//     () => (isEVM ? evmSteps : isSolana ? solanaSteps : []),
//     [evmSteps, isEVM, isSolana, solanaSteps],
//   )
//   return steps
// }
// todo namgold remove

export {}
