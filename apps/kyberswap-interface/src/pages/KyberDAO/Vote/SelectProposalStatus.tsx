import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { Collapse } from 'components/Collapse'
import { ProposalStatus } from 'hooks/kyberdao/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { cn } from 'utils/cn'

export default function SelectProposalStatus({
  status,
  setStatus,
}: {
  status?: string
  setStatus?: (s: string) => void
}) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setShow(false))
  return (
    <div ref={ref} className="relative w-full sm:w-36">
      <div
        onClick={() => setShow(s => !s)}
        className="relative z-[101] flex h-9 w-full cursor-pointer items-center justify-between rounded-full bg-background px-3 py-2 text-sm font-medium text-border hover:brightness-110"
      >
        <span className={cn(!!status && status !== 'All' && 'text-text')}>{status || 'All'}</span>
        <ChevronDown size={16} />
      </div>
      <Collapse open={show} className="absolute left-0 top-[calc(100%+4px)] z-[100] w-full">
        <div className="flex flex-col rounded-lg bg-tableHeader p-2 text-sm font-medium text-subText">
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
      </Collapse>
    </div>
  )
}
