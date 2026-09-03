import type { HTMLAttributes } from 'react'
import { Check } from 'react-feather'
import type { ActivityRow } from 'services/copyTrading/types/copyRuns'
import type { ActivitySubtype } from 'services/copyTrading/types/primitives'
import { formatUnits } from 'viem'

import Select, { type SelectOption } from 'components/Select'
import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { TxHashLink } from 'pages/CopyTrading/components/common/TxHashLink'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatTokenAmount } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type ActivityTypeView = {
  colorClassName: string
  label: string
  value: ActivitySubtype
}

export type ActivityLogTypeFilter = '' | 'buy' | 'sell' | 'capital' | 'failed_action' | 'fee_rebate'

type ActivityTypeFilterOption = Omit<SelectOption, 'value'> & {
  value: ActivityLogTypeFilter
}

const activityTypeViews: ActivityTypeView[] = [
  { colorClassName: 'text-primary', label: 'Buy', value: 'buy' },
  { colorClassName: 'text-red', label: 'Sell', value: 'sell' },
  { colorClassName: 'text-primary', label: 'Deposited', value: 'deposited' },
  { colorClassName: 'text-primary', label: 'Capital Topped Up', value: 'capital_topped_up' },
  { colorClassName: 'text-primary', label: 'Capital Withdrawn', value: 'capital_withdrawn' },
  { colorClassName: 'text-warning', label: 'Skipped Buy', value: 'skipped_buy' },
  { colorClassName: 'text-warning', label: 'Skipped Sell', value: 'skipped_sell' },
  { colorClassName: 'text-blue', label: 'Flat Fee Captured', value: 'flat_fee_captured' },
  { colorClassName: 'text-blue', label: 'Rebate Received', value: 'rebate_received' },
]

const activityTypeFilterOptions: ActivityTypeFilterOption[] = [
  { label: <span className="text-subText">ALL TYPE LOGS</span>, value: '' },
  { label: <span className="text-primary">BUY</span>, value: 'buy' },
  { label: <span className="text-red">SELL</span>, value: 'sell' },
  { label: <span className="text-primary">CAPITAL EVENTS</span>, value: 'capital' },
  { label: <span className="text-warning">FAILED ACTIONS</span>, value: 'failed_action' },
  { label: <span className="text-blue">FEE/REBATES</span>, value: 'fee_rebate' },
]

const ActivityGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[900px] grid-cols-[minmax(84px,0.8fr)_minmax(80px,0.8fr)_minmax(160px,1fr)_minmax(120px,1fr)_minmax(160px,1.3fr)_minmax(104px,0.9fr)] gap-x-3 whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

const getActivityAsset = (activity: ActivityRow) => {
  if (activity.position) {
    return { amountRaw: activity.position.displayBaseRaw, token: activity.position.baseToken }
  }
  if (activity.capital) return { amountRaw: activity.capital.amountRaw, token: activity.capital.token }
  if (activity.fee) return { amountRaw: activity.fee.amountRaw, token: activity.fee.token }

  return {}
}

const formatActivityAmount = (amountRaw?: string, decimals?: number) => {
  if (!amountRaw || decimals === undefined) return ''

  try {
    return formatTokenAmount(formatUnits(BigInt(amountRaw), decimals))
  } catch {
    return ''
  }
}

const getActivityTypeView = (activity: ActivityRow) => {
  return (
    activityTypeViews.find(type => type.value === activity.subtype) || {
      colorClassName: 'text-subText',
      label: '',
    }
  )
}

export const ActionLogsTable = ({
  infiniteScroll,
  loading,
  onTypeFilterChange,
  rows,
  typeFilter,
}: {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  onTypeFilterChange: (typeFilter: ActivityLogTypeFilter) => void
  rows: ActivityRow[]
  typeFilter: ActivityLogTypeFilter
}) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <ActivityGrid header className="sticky top-0 z-[1] hidden md:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell className="p-0">
            <Select
              arrow="chevron"
              arrowSize={14}
              className="w-[180px] min-w-0 bg-white/[0.08] px-3 py-2 text-xs font-medium text-subText hover:bg-white/[0.14]"
              matchMenuWidth
              onChange={onTypeFilterChange}
              optionRender={option => (
                <span className="flex w-full items-center justify-between gap-3">
                  {option?.label}
                  {option?.value === typeFilter && <Check className="shrink-0 text-subText" size={14} />}
                </span>
              )}
              options={activityTypeFilterOptions}
              value={typeFilter}
            />
          </HeaderCell>
          <HeaderCell className="justify-end text-right">Amount</HeaderCell>
          <HeaderCell className="justify-end text-right">Closed Time</HeaderCell>
          <HeaderCell className="justify-end text-right">Tx Hash</HeaderCell>
        </ActivityGrid>
        <TableBody
          className="grid gap-2 bg-transparent md:block md:min-w-[900px] md:bg-buttonBlack-60"
          empty={!rows.length}
          emptyMessage="No action logs found"
          loading={loading}
        >
          {rows.map(row => {
            const { amountRaw, token } = getActivityAsset(row)
            const amount = formatActivityAmount(amountRaw, token?.decimals)
            const type = getActivityTypeView(row)

            return (
              <div key={row.activityId}>
                <ActivityGrid className="max-md:hidden">
                  <TableCell className="text-subText">
                    <ShortenedId value={row.tradeId} />
                  </TableCell>
                  <TableCell>{token?.symbol || 'N/A'}</TableCell>
                  <TableCell className={type.colorClassName}>{type.label}</TableCell>
                  <TableCell className="text-right">{amount}</TableCell>
                  <TableCell className="text-right text-subText">{formatDateTime(row.occurredAt)}</TableCell>
                  <TableCell className="flex justify-end text-subText">
                    {row.txHash && <TxHashLink chainId={row.chainId} txHash={row.txHash} />}
                  </TableCell>
                </ActivityGrid>

                <Stack className="gap-3 rounded-xl bg-buttonBlack p-3 md:hidden">
                  <TableCardGrid>
                    <TableCardField label="Trade ID">
                      <ShortenedId value={row.tradeId} />
                    </TableCardField>
                    <TableCardField align="right" label="Tx Hash" valueClassName="text-subText">
                      {row.txHash && <TxHashLink chainId={row.chainId} txHash={row.txHash} />}
                    </TableCardField>
                    <TableCardField label="Token">{token?.symbol || 'N/A'}</TableCardField>
                    <TableCardField align="right" label="Type" valueClassName={type.colorClassName}>
                      {type.label}
                    </TableCardField>
                    <TableCardField label="Amount">{amount}</TableCardField>
                    <TableCardField align="right" label="Closed Time" valueClassName="text-subText">
                      {formatDateTime(row.occurredAt)}
                    </TableCardField>
                  </TableCardGrid>
                </Stack>
              </div>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}
