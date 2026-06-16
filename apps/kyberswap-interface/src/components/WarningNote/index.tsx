import { useState } from 'react'
import { AlertTriangle } from 'react-feather'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Row from 'components/Row'
import { cn } from 'utils/cn'

type SeverityLevel = 'warning' | 'serious'

type Props = {
  level?: SeverityLevel
  shortText: React.ReactNode
  longText?: React.ReactNode
  className?: string
}

const WarningNote: React.FC<Props> = ({ className, level = 'warning', shortText, longText = '' }) => {
  const [expanded, setExpanded] = useState(false)

  const isClickable = !!longText

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 rounded-[16px] px-4 py-3 text-xs font-normal leading-4',
        level === 'serious' ? 'bg-red-30' : 'bg-warning-30',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 transition-all duration-150 ease-linear',
          isClickable && 'cursor-pointer',
        )}
        onClick={() => {
          if (isClickable) {
            setExpanded(e => !e)
          }
        }}
      >
        <div className="flex size-4 shrink-0">
          <AlertTriangle size={16} className={level === 'serious' ? 'text-red' : 'text-warning'} />
        </div>
        <div className="flex flex-1 flex-col gap-2 text-text">{shortText}</div>

        {isClickable && (
          <div className="flex h-4 w-6 shrink-0 items-center justify-center">
            <div className="size-6">
              <DropdownSVG
                data-flip={expanded}
                className="size-6 text-text transition-transform duration-300 data-[flip=true]:rotate-180"
              />
            </div>
          </div>
        )}
      </div>
      {expanded && <Row className="pl-6">{longText}</Row>}
    </div>
  )
}

export default WarningNote
