import { t } from '@lingui/macro'
import type { ReactNode } from 'react'
import { ArrowRight } from 'react-feather'
import type { TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { mapRouteStateToSwapStatus } from 'services/crossChain/adapters/KyberCrossAdapter/utils'
import { CrossChainSwapFactory } from 'services/crossChain/factory'
import { getChainName, normalizeAdapterName } from 'services/crossChain/utils'

import Badge, { BadgeVariant } from 'components/Badge'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import { GasDropAmount } from 'components/GasDrop/GasDropAmount'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { GasDropTransactionLine } from 'components/SwapTransactions/TransactionDetail/GasDropTransactionLine'
import ExecutionTimeline from 'components/SwapTransactions/TransactionDetail/KyberCrossExecutionTimeline'
import TransactionDetailSkeleton from 'components/SwapTransactions/TransactionDetail/TransactionDetailSkeleton'
import TokenAmount from 'components/SwapTransactions/TransactionDetail/TransactionDetailTokenAmount'
import {
  type ExecutionStep,
  getExecutionFlowLabel,
  getExecutionSteps,
  getLocalExecutionSteps,
  isExecutionFinished,
} from 'components/SwapTransactions/TransactionDetail/kyberCrossDetail'
import { useKyberCrossDetail } from 'components/SwapTransactions/TransactionDetail/useKyberCrossDetail'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { useHistoryToken } from 'components/SwapTransactions/useHistoryToken'
import { TokenLogoWithChain } from 'components/TokenLogo/TokenLogoWithChain'
import { backendChainToChain } from 'state/crossChainSwap/model'
import { ExternalLinkIcon } from 'theme'
import type { Chain, Currency, SwapStatus } from 'types/crossChain'
import { shortenHash } from 'utils/address'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const TransactionDetailValue = ({ value, href }: { value: string; href?: string }) => (
  <HStack className="min-w-0 items-center gap-1 text-subText">
    <span className="truncate font-medium" title={value}>
      {shortenHash(value)}
    </span>
    {href ? (
      <ExternalLinkIcon href={href} className="size-3.5 shrink-0 text-subText [&>svg]:size-3.5" />
    ) : (
      <CopyHelper toCopy={value} />
    )}
  </HStack>
)

type TransferCardProps = {
  label: string
  token: Currency | string
  amount?: string
  amountUsd?: number
  chain: Chain
  address: string
  addressLabel: string
  children?: ReactNode
}

const TransferCard = ({
  label,
  token,
  amount,
  amountUsd,
  chain,
  address,
  addressLabel,
  children,
}: TransferCardProps) => {
  const resolved = useHistoryToken(token, chain)

  return (
    <Stack className="min-w-0 flex-1 overflow-hidden rounded-xl bg-background">
      <Stack className="flex-1 gap-3 p-4">
        <span className="text-xs font-medium text-subText">{label}</span>
        <HStack className="min-w-0 items-center gap-3">
          <TokenLogoWithChain
            currency={typeof resolved === 'string' ? undefined : resolved}
            chainId={chain}
            size={32}
            chainLogoStyle={{ width: 16, height: 16 }}
          />
          <Stack className="min-w-0 gap-0.5">
            <div className="min-h-7 break-words text-xl font-medium leading-7">
              <TokenAmount token={resolved} amount={amount} chain={chain} />
            </div>
            <HStack className="flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-medium text-subText">
              {amountUsd !== undefined && Number.isFinite(amountUsd) && amountUsd > 0 && (
                <>
                  <span>~{formatDisplayNumber(amountUsd, { style: 'currency', fractionDigits: 2 })}</span>
                  <span aria-hidden>•</span>
                </>
              )}
              <span>{getChainName(chain)}</span>
            </HStack>
          </Stack>
        </HStack>
        {children}
      </Stack>
      <Divider className="shrink-0 opacity-50" />
      <HStack className="min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-subText">
        <span className="font-medium">{addressLabel}</span>
        <TransactionDetailValue value={address} />
      </HStack>
    </Stack>
  )
}

const getDestinationLabel = (hasSwap: boolean, hasGasDrop: boolean) => {
  if (hasSwap) return hasGasDrop ? t`Destination Swap • Gas Drop` : t`Destination Swap`

  return hasGasDrop ? t`Destination Transaction • Gas Drop` : t`Destination Transaction`
}

const KyberCrossTransactions = ({ execution, tx }: { execution?: TrackingExecution; tx: HistoryTransaction }) => {
  const data = execution?.data
  const plan = tx.kyberCrossRoute
  const flow = execution?.flow_type ?? plan?.flowType

  const hasSourceSwap =
    !!data?.source_swap ||
    flow === 'swap_then_bridge' ||
    flow === 'swap_bridge_swap' ||
    (!execution && !!plan?.sourceSwap)
  const hasDestinationSwap =
    !!data?.dest_swap ||
    flow === 'bridge_then_swap' ||
    flow === 'swap_bridge_swap' ||
    (!execution && !!plan?.destinationSwap)
  const hasGasDrop =
    !!data?.gas_drop ||
    !!tx.gasDrop ||
    !!tx.gasDropStatus ||
    !!plan?.gasDropSwap ||
    execution?.route_state === 'GAS_DROP_PENDING'

  const destinationHash = execution ? execution.dest_tx_hash : tx.targetTxHash
  const receiveHash = data?.bridge?.dest?.tx_hash
  const hasSeparateReceive = !!receiveHash && receiveHash.toLowerCase() !== destinationHash?.toLowerCase()
  const loading = !execution || !isExecutionFinished(execution)

  const rows = [
    { id: 'route', label: t`Route ID`, value: execution?.route_plan_id || plan?.id, chain: undefined },
    {
      id: 'source',
      label: hasSourceSwap ? t`Source Swap` : t`Source Transaction`,
      value: execution?.source_tx_hash || tx.sourceTxHash,
      chain: tx.sourceChain,
    },
    { id: 'bridge', label: t`Bridge Deposit`, value: data?.bridge?.source?.tx_hash, chain: tx.sourceChain },
    ...(hasSeparateReceive
      ? [{ id: 'receive', label: t`Destination Receive`, value: receiveHash, chain: tx.targetChain }]
      : []),
    {
      id: 'destination',
      label: getDestinationLabel(hasDestinationSwap, hasGasDrop),
      value: destinationHash,
      chain: tx.targetChain,
    },
  ]

  return (
    <Stack className="overflow-hidden rounded-xl bg-background">
      <span className="px-4 py-3 text-sm font-medium">{t`Transactions`}</span>
      <Divider className="opacity-50" />
      <Stack className="gap-3 p-4 text-xs">
        {rows.map(({ id, label, value, chain }) => (
          <HStack key={id} className="min-h-4 flex-wrap items-center justify-between gap-2 text-subText">
            <span className="font-medium">{label}</span>
            {value ? (
              <TransactionDetailValue
                value={value}
                href={typeof chain === 'number' ? getEtherscanLink(chain, value, 'transaction') : undefined}
              />
            ) : loading ? (
              <span className="inline-flex h-4 items-center" aria-label={t`Waiting for ${label}`} aria-busy="true">
                <Skeleton inline width={100} height={12} variant="muted" />
              </span>
            ) : (
              <span>--</span>
            )}
          </HStack>
        ))}
      </Stack>
    </Stack>
  )
}

const ExecutionFee = ({
  fee,
  estimated,
}: {
  fee: { fee_type: 'partner_fee' | 'protocol_fee'; token: string; amount: string; chain: string }
  estimated: boolean
}) => {
  const chain = backendChainToChain(fee.chain)
  if (chain === undefined) return null

  return (
    <Stack className="gap-1.5">
      <span className="text-xs font-medium text-subText">
        {fee.fee_type === 'protocol_fee' ? t`KyberCross Fee` : t`Partner Fee`}
      </span>
      <span className="font-medium">
        {estimated && '~'}
        <TokenAmount token={fee.token} amount={fee.amount} chain={chain} />
        <span className="text-xs text-subText"> • {getChainName(chain)}</span>
      </span>
    </Stack>
  )
}

type ExecutionContentProps = {
  execution?: TrackingExecution
  tx: HistoryTransaction
  settlement: SwapStatus
  steps: ExecutionStep[]
}

const ExecutionContent = ({ execution, tx, settlement, steps }: ExecutionContentProps) => {
  const plan = tx.kyberCrossRoute
  const hasGasDrop = !!tx.gasDrop || !!execution?.data.gas_drop || !!plan?.gasDropSwap

  const bridgeProvider = execution ? execution.bridge_provider : plan?.bridgeProvider
  const flow = execution ? execution.flow_type : plan?.flowType
  const fees = execution ? execution.data.fees : plan?.fees?.map(fee => ({ ...fee, fee_type: fee.type }))
  const bridgeName =
    CrossChainSwapFactory.getKyberCrossBridgeSources()
      .find(source => normalizeAdapterName(source.getName()) === normalizeAdapterName(bridgeProvider || ''))
      ?.getName() ||
    bridgeProvider ||
    ''

  const received = execution ? execution.route_state === 'SUCCESS' : tx.status === 'Success'
  const outputAmount = received
    ? settlement.amountOut
    : settlement.status === 'Processing'
    ? tx.outputAmount
    : undefined

  // Local USD snapshots describe the quote; adjust the estimate to the displayed received amount.
  const usdBaseAmount = Number(tx.usesBackendData ? tx.outputAmount : tx.estimatedAmountOut || tx.outputAmount)
  const outputUsd =
    outputAmount !== undefined && usdBaseAmount > 0
      ? tx.amountOutUsd * (Number(outputAmount) / usdBaseAmount)
      : undefined

  return (
    <Stack className="gap-4">
      <ExecutionTimeline execution={execution} tx={tx} bridgeName={bridgeName} steps={steps} />
      <HStack className="items-stretch gap-3 max-sm:flex-col">
        <div className="flex min-w-0 flex-1 max-sm:w-full">
          <TransferCard
            label={t`From`}
            token={tx.sourceToken}
            amount={tx.inputAmount}
            amountUsd={tx.amountInUsd}
            chain={tx.sourceChain}
            address={execution?.from_address || tx.sender}
            addressLabel={t`Sender`}
          />
        </div>
        <ArrowRight size={20} className="shrink-0 self-center text-subText max-sm:rotate-90" />
        <div className="flex min-w-0 flex-1 max-sm:w-full">
          <TransferCard
            label={received ? t`Received` : settlement.status === 'Processing' ? t`Expected to receive` : t`To`}
            token={tx.targetToken}
            amount={outputAmount}
            amountUsd={outputUsd}
            chain={tx.targetChain}
            address={execution?.to_address || tx.recipient}
            addressLabel={t`Recipient`}
          >
            {settlement.gasDropStatus?.status === 'Delivered' && settlement.gasDropStatus.amount ? (
              <GasDropAmount gasDrop={{ amount: settlement.gasDropStatus.amount }} chain={tx.targetChain} />
            ) : (
              hasGasDrop && (
                <GasDropTransactionLine
                  showSeparator={false}
                  tx={{
                    ...tx,
                    status: settlement.status,
                    gasDropStatus: settlement.gasDropStatus,
                    targetTxHash: undefined,
                  }}
                />
              )
            )}
          </TransferCard>
        </div>
      </HStack>
      {(flow || bridgeName || !!fees?.length) && (
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-background p-4 text-sm">
          {flow && (
            <Stack className="gap-1.5">
              <span className="text-xs font-medium text-subText">{t`Flow`}</span>
              <span className="font-medium text-primary">{getExecutionFlowLabel(flow)}</span>
            </Stack>
          )}
          {bridgeName && (
            <Stack className="gap-1.5">
              <span className="text-xs font-medium text-subText">{t`Bridge`}</span>
              <span className="font-medium">{bridgeName}</span>
            </Stack>
          )}
          {fees?.map((fee, index) => (
            <ExecutionFee key={`${fee.fee_type}:${fee.chain}:${fee.token}:${index}`} fee={fee} estimated={!execution} />
          ))}
        </div>
      )}
      <KyberCrossTransactions execution={execution} tx={tx} />
    </Stack>
  )
}

const KyberCrossTransactionDetail = ({ tx }: { tx: HistoryTransaction }) => {
  const { data, isPending, isError, errorUpdatedAt } = useKyberCrossDetail(tx)
  const waitingForExecution = !data && errorUpdatedAt > 0
  const execution = isError ? undefined : data

  const steps = execution ? getExecutionSteps(execution, !!tx.gasDrop) : getLocalExecutionSteps(tx)
  const settlement: SwapStatus = execution
    ? mapRouteStateToSwapStatus(execution, !!tx.gasDrop || !!execution.data.gas_drop)
    : {
        status: tx.status || 'Processing',
        amountOut: tx.outputAmount,
        gasDropStatus: tx.gasDropStatus,
        txHash: tx.targetTxHash || '',
      }

  const status = settlement.status
  const statusLabel =
    status === 'Success'
      ? t`Completed`
      : status === 'Failed'
      ? t`Failed`
      : status === 'Refunded'
      ? t`Refunded`
      : t`Processing`
  const statusVariant =
    status === 'Success' ? BadgeVariant.PRIMARY : status === 'Failed' ? BadgeVariant.NEGATIVE : BadgeVariant.WARNING

  if (isPending && !waitingForExecution) return <TransactionDetailSkeleton />

  return (
    <Stack className="gap-4">
      <HStack className="min-h-5 items-center justify-between gap-3 text-sm">
        <span className="font-medium">KyberCross</span>
        <Badge variant={statusVariant} className="gap-1.5 py-0.5 text-xs" role="status">
          <span>{statusLabel}</span>
        </Badge>
      </HStack>
      <ExecutionContent execution={execution} tx={tx} settlement={settlement} steps={steps} />
    </Stack>
  )
}

export default KyberCrossTransactionDetail
