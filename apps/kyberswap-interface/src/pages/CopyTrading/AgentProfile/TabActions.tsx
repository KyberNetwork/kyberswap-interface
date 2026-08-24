import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink as ExternalLinkIcon } from 'react-feather'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import type { CotLog } from 'services/copyTrading/types/positions'

import { HStack, Stack } from 'components/Stack'
import { isSupportedChainId } from 'constants/networks'
import InfiniteScroll, { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { TableBody } from 'pages/CopyTrading/components/Table'
import { ExternalLink } from 'theme'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10

const formatStatus = (status: string) => {
  return status?.replace(/[-_]/g, ' ').replace(/\b\w/g, value => value.toUpperCase()) ?? '-'
}

const statusClassName = (status: string) =>
  status === 'broadcast'
    ? 'text-primary'
    : status === 'failed'
    ? 'text-red'
    : status === 'skipped'
    ? 'text-warning'
    : 'text-subText'

const DetailSection = ({ label, children }: PropsWithChildren<{ label: string }>) => (
  <Stack className="gap-1">
    <span className="text-xs font-medium uppercase text-primary">{label}</span>
    <p className="whitespace-pre-line break-words text-sm text-subText">{children}</p>
  </Stack>
)

const TxLink = ({ chainId, txHash }: { chainId: number; txHash?: string }) => {
  if (!txHash) {
    return <span className="italic text-subText">(No transaction)</span>
  }

  const displayHash = shortenHash(txHash, 4)

  return (
    <span className="inline-flex items-center gap-1">
      {!isSupportedChainId(chainId) ? (
        <span className="text-blue" title={txHash}>
          {displayHash}
        </span>
      ) : (
        <ExternalLink
          href={getEtherscanLink(chainId, txHash, 'transaction')}
          className="inline-flex items-center gap-1 text-blue"
        >
          <span title={txHash}>{displayHash}</span>
          <ExternalLinkIcon size={12} />
        </ExternalLink>
      )}
    </span>
  )
}

type ActionLogRowProps = {
  expanded: boolean
  onToggle: (id: string) => void
  row: CotLog
}

const ActionLogRow = ({ expanded, onToggle, row }: ActionLogRowProps) => {
  const toggle = () => onToggle(row.logId)
  const summary = row.summary?.trim()
  const showSummary = !!summary && summary.toLowerCase() !== row.action.trim().toLowerCase()

  return (
    <Stack className="gap-1.5 p-3">
      <Stack
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="-m-1 min-w-0 cursor-pointer gap-1.5 rounded-md p-1 outline-none hover:bg-white-04"
        onClick={toggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
      >
        <HStack className="min-w-0 items-center gap-2 text-sm text-subText">
          <span className={cn('shrink-0 rounded bg-primary-12 px-2 py-0.5 font-medium', statusClassName(row.status))}>
            {formatStatus(row.status)}
          </span>
          <span className="min-w-0 flex-1 break-words font-medium text-text">{row.action}</span>
          <span className="shrink-0 text-xs">{formatDateTime(row.occurredAt)}</span>
          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-text">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </HStack>
        {showSummary && <p className="break-words text-sm text-subText">{summary}</p>}
        {(row.trigger || row.reasoning) && (
          <Stack className="min-w-0 flex-wrap gap-y-1 text-xs text-subText">
            {row.trigger && (
              <span className="min-w-0 truncate">
                <span className="font-medium text-text">Trigger:</span> {row.trigger}
              </span>
            )}
            {row.reasoning && (
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium text-text">Reasoning:</span> {row.reasoning}
              </span>
            )}
          </Stack>
        )}
      </Stack>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="action-log-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Stack className="min-w-0 gap-4 pt-3">
              <DetailSection label="Trigger">{row.trigger}</DetailSection>
              <DetailSection label="Data">{row.data}</DetailSection>
              <DetailSection label="Reasoning">{row.reasoning}</DetailSection>
              <HStack className="flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {row.txHash && (
                  <span className={cn('font-medium uppercase', statusClassName(row.status))}>
                    {formatStatus(row.status)}
                  </span>
                )}
                <TxLink chainId={row.chainId} txHash={row.txHash} />
              </HStack>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  )
}

const TabActions = ({ agentId }: { agentId: string }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [getActionLogs] = agentApi.useLazyGetAgentActionLogsQuery()

  const {
    infiniteScroll,
    isFetching,
    items: rows,
  } = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'agent-action-logs', agentId],
    queryFn: cursor =>
      getActionLogs({
        agentId,
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const toggleExpanded = (id: string) => {
    setExpandedIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <TableBody empty={!rows.length} emptyMessage="No action logs found" loading={isFetching && !rows.length}>
          <Stack className="gap-0 px-4 py-2">
            {rows.map(row => (
              <ActionLogRow
                key={row.logId}
                expanded={expandedIds.includes(row.logId)}
                onToggle={toggleExpanded}
                row={row}
              />
            ))}
          </Stack>
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default TabActions
