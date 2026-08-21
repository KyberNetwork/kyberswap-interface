import type { HTMLAttributes } from 'react'
import type { ActivityRow } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
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
        <ActivityGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Type</HeaderCell>
          <HeaderCell>Details</HeaderCell>
          <HeaderCell>Tx Hash</HeaderCell>
          <HeaderCell>Time</HeaderCell>
        </ActivityGrid>
        <TableBody className="min-w-[900px]" empty={!rows.length} emptyMessage="No action logs found" loading={loading}>
          {rows.map(row => (
            <ActivityGrid key={row.activityId}>
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
          ))}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}
