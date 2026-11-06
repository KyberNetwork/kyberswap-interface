import { t } from '@lingui/macro'
import type { TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { isExecutionFinished, mapRouteStateToSwapStatus } from 'services/crossChain/adapters/KyberCrossAdapter/utils'

import type { NormalizedTxResponse } from 'types/crossChain'

export type ExecutionStep = {
  id: 'created' | 'source-swap' | 'bridge' | 'destination-swap' | 'gas-drop' | 'settlement'
  label: string
  status: 'complete' | 'pending' | 'waiting' | 'failed' | 'skipped' | 'unknown'
}

export const getExecutionFlowLabel = (flow: TrackingExecution['flow_type']) => {
  switch (flow) {
    case 'bridge_only':
      return t`Bridge`
    case 'swap_then_bridge':
      return t`Swap → Bridge`
    case 'bridge_then_swap':
      return t`Bridge → Swap`
    case 'swap_bridge_swap':
      return t`Swap → Bridge → Swap`
  }
}

export const getExecutionStateLabel = (state: TrackingExecution['route_state']) => {
  switch (state) {
    case 'SUCCESS':
      return t`Completed`
    case 'FAILED':
      return t`Failed`
    case 'REFUNDED':
      return t`Refunded`
    case 'BRIDGE_PENDING':
      return t`Bridging`
    case 'BRIDGE_CLAIM_PENDING':
      return t`Bridge claim pending`
    case 'BRIDGE_EXPIRED':
      return t`Bridge expired`
    case 'BRIDGE_FAILED':
      return t`Bridge failed`
    case 'DST_ACTION_PENDING':
      return t`Destination action pending`
    case 'DST_RECEIVED':
      return t`Received on destination`
    case 'GAS_DROP_PENDING':
      return t`Gas drop pending`
    case 'SWAP_PENDING':
      return t`Destination swap pending`
    case 'SWAP_EXPIRED':
      return t`Swap expired`
    case 'SWAP_UNEXECUTABLE':
      return t`Swap could not be executed`
    case 'SWAP_REFUND_PENDING':
      return t`Refund pending`
    default:
      return t`Processing`
  }
}

/** Progress comes from execution data, never from the quoted output in history. */
export const getExecutionSteps = (execution: TrackingExecution, hasGasDrop = false): ExecutionStep[] => {
  const { data, flow_type: flow, route_state: state } = execution
  const success = state === 'SUCCESS'
  const finished = isExecutionFinished(execution)
  const bridgeFailed = state === 'BRIDGE_FAILED' || state === 'BRIDGE_EXPIRED'
  const swapFailed = state === 'SWAP_EXPIRED' || state === 'SWAP_UNEXECUTABLE'
  const refunding = state === 'REFUNDED' || state === 'SWAP_REFUND_PENDING'

  const steps: ExecutionStep[] = [{ id: 'created', label: t`Source transaction submitted`, status: 'complete' }]

  if (flow === 'swap_then_bridge' || flow === 'swap_bridge_swap') {
    steps.push({
      id: 'source-swap',
      label: t`Source swap`,
      status: data.source_swap || data.bridge?.source || success ? 'complete' : 'waiting',
    })
  }

  steps.push({
    id: 'bridge',
    label: t`Bridge`,
    status: data.bridge?.dest || success ? 'complete' : bridgeFailed ? 'failed' : 'waiting',
  })

  if (hasGasDrop || data.gas_drop || state === 'GAS_DROP_PENDING') {
    steps.push({
      id: 'gas-drop',
      label: t`Gas drop`,
      status: getGasDropStepStatus(mapRouteStateToSwapStatus(execution, true)),
    })
  }

  if (flow === 'bridge_then_swap' || flow === 'swap_bridge_swap') {
    steps.push({
      id: 'destination-swap',
      label: t`Destination swap`,
      status:
        data.dest_swap || success
          ? 'complete'
          : data.refund?.chain === execution.source_chain
          ? 'skipped'
          : swapFailed || refunding || (state === 'FAILED' && !!data.bridge?.dest)
          ? 'failed'
          : 'waiting',
    })
  }

  steps.push({
    id: 'settlement',
    label: state === 'REFUNDED' || state === 'SWAP_REFUND_PENDING' ? t`Refund` : t`Funds delivered`,
    status: success || state === 'REFUNDED' ? 'complete' : state === 'FAILED' ? 'failed' : 'waiting',
  })

  const next = steps.find(step => step.status === 'waiting')
  for (const step of steps) {
    if (step.status !== 'waiting') continue
    step.status = finished || bridgeFailed ? 'skipped' : step === next && !swapFailed ? 'pending' : 'waiting'
  }

  // A refund is the active action after a failed destination swap.
  if (state === 'SWAP_REFUND_PENDING') {
    for (const step of steps) {
      if (step.status === 'pending' || step.status === 'waiting') step.status = 'skipped'
    }

    steps[steps.length - 1].status = 'pending'
  }

  return steps
}

const getGasDropStepStatus = (tx: Pick<NormalizedTxResponse, 'status' | 'gasDropStatus'>): ExecutionStep['status'] => {
  const gasStatus = tx.gasDropStatus?.status
  if (gasStatus === 'Delivered') return 'complete'
  if (gasStatus === 'Failed') return 'failed'
  if (gasStatus === 'NotExecuted') return 'skipped'

  const stopped = tx.status === 'Failed' || tx.status === 'Refunded'
  if (stopped || (tx.status === 'Success' && !gasStatus)) return 'unknown'

  return 'waiting'
}

/** Plans describe the route, not execution receipts. Only FE status confirms completion. */
export const getLocalExecutionSteps = (
  tx: Pick<NormalizedTxResponse, 'status' | 'kyberCrossRoute' | 'gasDrop' | 'gasDropStatus'>,
): ExecutionStep[] => {
  const plan = tx.kyberCrossRoute
  const flow = plan?.flowType
  const success = tx.status === 'Success'
  const stopped = tx.status === 'Failed' || tx.status === 'Refunded'
  const routeStatus = success ? 'complete' : stopped ? 'unknown' : 'waiting'

  const steps: ExecutionStep[] = [{ id: 'created', label: t`Source transaction submitted`, status: 'complete' }]

  if (plan?.sourceSwap || flow === 'swap_then_bridge' || flow === 'swap_bridge_swap') {
    steps.push({ id: 'source-swap', label: t`Source swap`, status: routeStatus })
  }

  steps.push({ id: 'bridge', label: t`Bridge`, status: routeStatus })

  if (tx.gasDrop || tx.gasDropStatus || plan?.gasDropSwap) {
    steps.push({ id: 'gas-drop', label: t`Gas drop`, status: getGasDropStepStatus(tx) })
  }

  if (plan?.destinationSwap || flow === 'bridge_then_swap' || flow === 'swap_bridge_swap') {
    steps.push({ id: 'destination-swap', label: t`Destination swap`, status: routeStatus })
  }

  steps.push({
    id: 'settlement',
    label: tx.status === 'Refunded' ? t`Refund` : t`Funds delivered`,
    status: success || tx.status === 'Refunded' ? 'complete' : tx.status === 'Failed' ? 'failed' : 'waiting',
  })

  if (!success && !stopped) {
    const next = steps.find(step => step.status === 'waiting')
    if (next) next.status = 'pending'
  }

  return steps
}
