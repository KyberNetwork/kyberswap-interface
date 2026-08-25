import type { HTMLAttributes } from 'react'
import type { ActivityRow } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { getActivityLabel } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ActivityGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[900px] grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]',
        className,
      )}
      {...props}
    />
  )
}

const activityColor = (activity: ActivityRow) => {
  if (activity.activityType.includes('failed') || activity.activityType.includes('skipped')) return 'text-warning'
  if (activity.activityType === 'copy_stopped') return 'text-red'
  if (activity.activityType.includes('closed') || activity.activityType.includes('succeeded')) return 'text-primary'
  return 'text-text'
}

export const ActionLogsTable = ({
  infiniteScroll,
  loading,
  rows,
}: {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: ActivityRow[]
}) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <ActivityGrid header className="sticky top-0 z-[1] hidden md:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Type</HeaderCell>
          <HeaderCell>Details</HeaderCell>
          <HeaderCell>Tx Hash</HeaderCell>
          <HeaderCell>Time</HeaderCell>
        </ActivityGrid>
        <TableBody
          className="grid gap-2 bg-transparent md:block md:min-w-[900px] md:bg-buttonBlack-60"
          empty={!rows.length}
          emptyMessage="No action logs found"
          loading={loading}
        >
          {rows.map(row => (
            <div key={row.activityId}>
              <ActivityGrid className="max-md:hidden">
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell className={activityColor(row)}>{getActivityLabel(row)}</TableCell>
                <TableCell>{row.summary || '—'}</TableCell>
                <TableCell className="text-subText">
                  <ShortenedId value={row.txHash} />
                </TableCell>
                <TableCell className="text-subText">{formatDateTime(row.occurredAt)}</TableCell>
              </ActivityGrid>

              <Stack className="gap-3 rounded-xl bg-buttonBlack-60 p-3 md:hidden">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <TableCardField label="Type" valueClassName={activityColor(row)}>
                    {getActivityLabel(row)}
                  </TableCardField>
                  <TableCardField label="Time" valueClassName="text-right text-subText">
                    {formatDateTime(row.occurredAt)}
                  </TableCardField>
                  <TableCardField label="Trade ID">
                    <ShortenedId value={row.tradeId} />
                  </TableCardField>
                  <TableCardField label="Tx Hash" valueClassName="text-subText">
                    <ShortenedId value={row.txHash} />
                  </TableCardField>
                  <TableCardField className="col-span-2" label="Details" valueClassName="break-words">
                    {row.summary || '—'}
                  </TableCardField>
                </div>
              </Stack>
            </div>
          ))}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}
