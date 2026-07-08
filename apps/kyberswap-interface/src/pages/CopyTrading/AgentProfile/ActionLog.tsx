import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import type { CotLog } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import { formatDate } from 'pages/CopyTrading/helpers'

const ActionLog = ({ rows }: { rows: CotLog[] }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(rows[0] ? [rows[0].logId] : [])

  const toggleExpanded = (id: string) => {
    setExpandedIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  return (
    <Stack className="px-8 py-6 max-md:px-5">
      {rows.map(row => {
        const expanded = expandedIds.includes(row.logId)
        const txHash = row.txHash || '-'

        return (
          <Stack key={row.logId} className="gap-3 border-b border-border py-4 text-sm text-subText">
            <HStack
              as="button"
              onClick={() => toggleExpanded(row.logId)}
              className="w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-0 text-left text-subText"
            >
              <HStack className="min-w-0 items-center gap-3.5">
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                <HStack className="min-w-0 flex-wrap items-center gap-2 break-words">
                  <span>{formatDate(row.occurredAt)}</span>
                  <span>Block #25,876,765</span>
                  <span className="text-blue">{txHash}</span>
                </HStack>
              </HStack>
              <span className="shrink-0">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
            </HStack>
            <Stack className="min-w-0 gap-2.5 pl-8 max-md:pl-5">
              <span className="text-text">{row.action}</span>
              {expanded && (
                <>
                  <p>
                    <span className="font-medium text-primary">TRIGGER:</span> {row.trigger}
                  </p>
                  <p className="whitespace-pre-line break-words">
                    <span className="font-medium text-primary">DATA:</span>
                    <br />
                    {row.data}
                  </p>
                  {!!row.reasoning && (
                    <p>
                      <span className="font-medium text-primary">REASONING:</span>
                      <br />
                      {row.reasoning}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-primary">ACTION:</span>
                    <br />
                    {row.action}
                    <br />
                    <span className="text-primary">✓ Confirmed</span> Tx: {txHash}
                  </p>
                </>
              )}
            </Stack>
          </Stack>
        )
      })}
    </Stack>
  )
}

export default ActionLog
