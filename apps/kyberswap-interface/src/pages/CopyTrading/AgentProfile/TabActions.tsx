import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink as ExternalLinkIcon } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import { type CotLog } from 'services/copyTrading/types'

import IconButton from 'components/IconButton'
import { HStack, Stack } from 'components/Stack'
import { isSupportedChainId } from 'constants/networks'
import { TableBody } from 'pages/CopyTrading/components/Table'
import { formatDate } from 'pages/CopyTrading/helpers'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/index'

const formatLogTime = (value?: string) => {
  const date = formatDate(value)
  return date === '-' ? date : `${date} UTC`
}

const formatStatus = (status: string) => {
  return status?.replace(/[-_]/g, ' ').replace(/\b\w/g, value => value.toUpperCase()) ?? '-'
}

const DetailSection = ({ label, children }: PropsWithChildren<{ label: string }>) => (
  <Stack className="gap-1">
    <span className="text-xs font-medium uppercase text-primary">{label}</span>
    <div className="whitespace-pre-line break-words text-sm text-subText">{children}</div>
  </Stack>
)

const TxLink = ({ chainId, txHash }: { chainId: number; txHash?: string }) => {
  if (!txHash) return <span>-</span>
  if (!isSupportedChainId(chainId)) return <span className="text-blue">{txHash}</span>

  return (
    <ExternalLink
      href={getEtherscanLink(chainId, txHash, 'transaction')}
      className="inline-flex items-center gap-1 text-blue"
    >
      <span>{txHash}</span>
      <ExternalLinkIcon size={12} />
    </ExternalLink>
  )
}

type ActionLogRowProps = {
  expanded: boolean
  onToggle: (id: string) => void
  row: CotLog
}

const ActionLogRow = ({ expanded, onToggle, row }: ActionLogRowProps) => {
  return (
    <Stack className="border-b border-darkBorder py-3 last:border-b-0">
      <HStack className="w-full items-center gap-3 text-subText">
        <span className="size-2 shrink-0 rounded-full bg-primary" />
        <Stack className="min-w-0 flex-1 gap-1">
          <HStack className="min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>{formatLogTime(row.occurredAt)}</span>
            <span className="rounded bg-primary-12 px-2 py-0.5 font-medium text-primary">
              {formatStatus(row.status)}
            </span>
          </HStack>
          <span className="break-words text-sm font-medium text-text">{row.action}</span>
        </Stack>
        <IconButton aria-expanded={expanded} onClick={() => onToggle(row.logId)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </IconButton>
      </HStack>

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
            <Stack className="min-w-0 gap-4 pl-5 pt-4">
              <DetailSection label="Trigger">{row.trigger}</DetailSection>
              <DetailSection label="Data">{row.data}</DetailSection>
              <DetailSection label="Reasoning">{row.reasoning}</DetailSection>
              <DetailSection label="Action">{row.action}</DetailSection>
              <HStack className="flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span
                  className={cn('font-medium uppercase', row.status === 'confirmed' ? 'text-primary' : 'text-subText')}
                >
                  {formatStatus(row.status)}
                </span>
                <span>
                  Tx: <TxLink chainId={row.chainId} txHash={row.txHash} />
                </span>
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

  const { data: cotLogs, isFetching } = copyTradingApi.useGetAgentCotLogsQuery({ agentId })
  const rows = useMemo(() => cotLogs?.data || [], [cotLogs?.data])

  const toggleExpanded = (id: string) => {
    setExpandedIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  return (
    <TableBody empty={!rows.length} emptyMessage="No action logs found" loading={isFetching}>
      <Stack className="px-4 py-2">
        {rows?.map(row => (
          <ActionLogRow
            key={row.logId}
            expanded={expandedIds.includes(row.logId)}
            onToggle={toggleExpanded}
            row={row}
          />
        ))}
      </Stack>
    </TableBody>
  )
}

export default TabActions
