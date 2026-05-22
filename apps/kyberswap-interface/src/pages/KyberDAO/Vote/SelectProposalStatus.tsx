import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { ProposalStatus } from 'hooks/kyberdao/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export default function SelectProposalStatus({
  status,
  setStatus,
}: {
  status?: string
  setStatus?: (s: string) => void
}) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setShow(false))
  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setShow(s => !s)}
        className="relative z-[101] flex h-9 w-[min(140px,30vw)] cursor-pointer items-center justify-between rounded-[20px] bg-background px-3 py-2 text-sm font-medium text-border hover:brightness-110"
      >
        <span style={!!status && status !== 'All' ? { color: theme.text } : undefined}>{status || 'All'}</span>
        <ChevronDown size={16} />
      </div>
      <div
        className={cn(
          'absolute left-0 z-[100] flex w-[140px] flex-col overflow-hidden rounded-lg bg-tableHeader p-2 text-sm font-medium text-subText transition-all duration-200 ease-linear',
          show ? 'top-[calc(100%+4px)] max-h-[500px] opacity-100' : 'top-0 max-h-0 opacity-0',
        )}
      >
        <div
          key="All"
          onClick={() => {
            setShow(false)
            setStatus?.('')
          }}
          className={cn('cursor-pointer rounded px-2 py-1.5 hover:bg-buttonGray', !status && 'text-primary')}
        >
          <Trans>All</Trans>
        </div>
        {Object.values(ProposalStatus).map(s => {
          return (
            <div
              key={s}
              onClick={() => {
                setShow(false)
                setStatus?.(s)
              }}
              className={cn('cursor-pointer rounded px-2 py-1.5 hover:bg-buttonGray', s === status && 'text-primary')}
            >
              {s}
            </div>
          )
        })}
      </div>
    </div>
  )
}
