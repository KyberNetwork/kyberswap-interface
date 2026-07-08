import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { CopyTradingActionLog } from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'

const ActionLog = ({ rows }: { rows: CopyTradingActionLog[] }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(rows[0] ? [rows[0].id] : [])

  const toggleExpanded = (id: string) => {
    setExpandedIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  return (
    <Stack className="px-8 py-6 max-md:px-5">
      {rows.map(row => {
        const expanded = expandedIds.includes(row.id)
        return (
          <Stack key={row.id} className="gap-3 border-b border-border py-4 text-sm text-subText">
            <HStack
              as="button"
              onClick={() => toggleExpanded(row.id)}
              className="w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-0 text-left text-subText"
            >
              <HStack className="min-w-0 items-center gap-3.5">
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 break-words">
                  {row.time} <span className="ml-2">Block {row.block}</span>{' '}
                  <span className="ml-2 text-blue">{row.tx}</span>
                </span>
              </HStack>
              <span className="shrink-0">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
            </HStack>
            <Stack className="min-w-0 gap-2.5 pl-8 max-md:pl-5">
              <span className="text-text">{row.summary}</span>
              {expanded && (
                <>
                  <p className="m-0">
                    <span className="font-semibold text-primary">TRIGGER:</span> {row.trigger}
                  </p>
                  <p className="m-0 whitespace-pre-line break-words">
                    <span className="font-semibold text-primary">DATA:</span>
                    <br />
                    {row.data}
                  </p>
                  {!!row.reasoning && (
                    <p className="m-0">
                      <span className="font-semibold text-primary">REASONING:</span>
                      <br />
                      {row.reasoning}
                    </p>
                  )}
                  <p className="m-0">
                    <span className="font-semibold text-primary">ACTION:</span>
                    <br />
                    {row.action}
                    <br />
                    <span className="text-primary">✓ Confirmed</span> Tx: {row.confirmedTx}
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
