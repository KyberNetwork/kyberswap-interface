import { type CSSProperties, type ReactNode, useState } from 'react'
import { AlertTriangle, ChevronDown, Info } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

const WARNING_STYLES = {
  error: { backgroundClass: 'bg-red-25', colorClass: 'text-red', Icon: AlertTriangle },
  info: { backgroundClass: 'bg-primary-20', colorClass: 'text-primary', Icon: Info },
  warn: { backgroundClass: 'bg-warning-25', colorClass: 'text-warning', Icon: AlertTriangle },
} as const

type ErrorWarningProps = {
  title: ReactNode
  type: keyof typeof WARNING_STYLES
  desc?: ReactNode
  style?: CSSProperties
  className?: string
  action?: ReactNode
}

export const ErrorWarning = ({ title, type, desc, style: customStyle = {}, className, action }: ErrorWarningProps) => {
  const [expanded, setExpanded] = useState(false)
  const { backgroundClass, colorClass, Icon } = WARNING_STYLES[type]

  if (!desc) {
    return (
      <HStack
        className={cn('items-start gap-2 rounded-2xl px-3 py-2', backgroundClass, colorClass, className)}
        style={customStyle}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 text-xs font-medium italic text-text-60">{title}</span>
        {action}
      </HStack>
    )
  }

  return (
    <Stack className={cn('rounded-2xl px-3 py-2', backgroundClass, className)} style={customStyle}>
      <HStack
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className={cn('cursor-pointer select-none items-start gap-2', colorClass)}
        onClick={() => setExpanded(value => !value)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setExpanded(value => !value)
          }
        }}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 text-xs font-medium italic text-text-60">{title}</span>
        {action}
        <HStack
          data-expanded={expanded}
          className="size-4 shrink-0 items-center justify-center text-text-60 transition-transform duration-200 ease-in-out data-[expanded=true]:rotate-180"
        >
          <ChevronDown size={14} />
        </HStack>
      </HStack>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <Stack className="gap-2 pl-6 pt-2 text-xs font-normal text-text">{desc}</Stack>
        </div>
      </div>
    </Stack>
  )
}
