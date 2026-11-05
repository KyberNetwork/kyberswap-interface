import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { CheckCircle, Circle, XCircle } from 'react-feather'
import type { TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { getChainName } from 'services/crossChain/utils'

import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import TokenAmount from 'components/SwapTransactions/TransactionDetail/TransactionDetailTokenAmount'
import type { ExecutionStep } from 'components/SwapTransactions/TransactionDetail/kyberCrossDetail'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import type { Chain, KyberCrossPlannedSwap } from 'types/crossChain'
import { cn } from 'utils/cn'

const SwapStepAmounts = ({
  swap,
  chain,
  estimated,
}: {
  swap: KyberCrossPlannedSwap
  chain: Chain
  estimated?: boolean
}) => (
  <span>
    {estimated && <>{t`Estimated`} • </>}
    <TokenAmount token={swap.tokenIn} amount={swap.inputAmount} chain={chain} />
    {' → '}
    <TokenAmount token={swap.tokenOut} amount={swap.outputAmount} chain={chain} />
    {' • '}
    {getChainName(chain)}
  </span>
)

type StepDescriptionProps = {
  step: ExecutionStep['id']
  execution?: TrackingExecution
  tx: HistoryTransaction
  bridgeName: string
}

const StepDescription = ({ step, execution, tx, bridgeName }: StepDescriptionProps) => {
  const data = execution?.data
  const plan = tx.kyberCrossRoute

  const actual =
    step === 'source-swap'
      ? data?.source_swap
      : step === 'destination-swap'
      ? data?.dest_swap
      : step === 'gas-drop'
      ? data?.gas_drop
      : undefined

  const planned =
    step === 'source-swap'
      ? plan?.sourceSwap
      : step === 'destination-swap'
      ? plan?.destinationSwap
      : step === 'gas-drop'
      ? plan?.gasDropSwap
      : undefined

  const swap = actual
    ? {
        tokenIn: actual.token_in,
        tokenOut: actual.token_out,
        inputAmount: actual.input_amount,
        outputAmount: actual.output_amount,
      }
    : !execution
    ? planned
    : undefined

  if (step !== 'created' && step !== 'bridge' && !swap && !(step === 'settlement' && data?.refund)) return null

  return (
    <div className="break-words text-xs leading-5 text-subText">
      {step === 'created' && format(tx.timestamp, 'dd/MM/yyyy HH:mm:ss')}
      {swap && (
        <SwapStepAmounts
          swap={swap}
          estimated={!actual}
          chain={step === 'source-swap' ? tx.sourceChain : tx.targetChain}
        />
      )}
      {step === 'bridge' && (
        <span>
          {bridgeName && <>{bridgeName} • </>}
          {getChainName(tx.sourceChain)} → {getChainName(tx.targetChain)}
          {data?.bridge?.dest && (
            <>
              {' '}
              • <TokenAmount token={data.bridge.dest.token} amount={data.bridge.dest.amount} chain={tx.targetChain} />
            </>
          )}
        </span>
      )}
      {step === 'settlement' && data?.refund && (
        <TokenAmount
          token={data.refund.token}
          amount={data.refund.amount}
          chain={data.refund.chain === execution?.source_chain ? tx.sourceChain : tx.targetChain}
        />
      )}
    </div>
  )
}

type ExecutionTimelineProps = {
  execution?: TrackingExecution
  tx: HistoryTransaction
  bridgeName: string
  steps: ExecutionStep[]
}

const ExecutionTimeline = ({ execution, tx, bridgeName, steps }: ExecutionTimelineProps) => {
  const statusLabels = {
    complete: t`Completed`,
    pending: t`Processing`,
    waiting: t`Pending`,
    failed: t`Failed`,
    skipped: t`Not executed`,
    unknown: '—',
  }

  return (
    <ol className="rounded-xl bg-background p-4">
      {steps.map((step, index) => (
        <li key={step.id} className="flex gap-3">
          <Stack className="items-center gap-1">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center',
                step.status === 'complete'
                  ? 'text-primary'
                  : step.status === 'failed'
                  ? 'text-red'
                  : step.status === 'pending'
                  ? 'text-warning'
                  : 'text-subText',
              )}
            >
              {step.status === 'complete' ? (
                <CheckCircle size={18} />
              ) : step.status === 'failed' ? (
                <XCircle size={18} />
              ) : step.status === 'pending' ? (
                <Loader size="18px" />
              ) : (
                <Circle size={18} />
              )}
            </span>
            {index < steps.length - 1 && <div className="w-px flex-1 bg-border" />}
          </Stack>
          <Stack className={cn('min-w-0 flex-1 gap-1.5', index < steps.length - 1 && 'pb-4')}>
            <HStack className="flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{step.label}</span>
              <span className="text-xs font-medium text-subText">{statusLabels[step.status]}</span>
            </HStack>
            <StepDescription step={step.id} execution={execution} tx={tx} bridgeName={bridgeName} />
          </Stack>
        </li>
      ))}
    </ol>
  )
}

export default ExecutionTimeline
