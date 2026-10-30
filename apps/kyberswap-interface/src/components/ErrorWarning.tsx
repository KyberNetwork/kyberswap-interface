import { type CSSProperties, type ReactNode, useId, useState } from 'react'
import { AlertTriangle, ChevronDown, Info } from 'react-feather'

import IconButton from 'components/Button/IconButton'
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
  dataTestId?: string
}

export const ErrorWarning = ({
  title,
  type,
  desc,
  style: customStyle = {},
  className,
  action,
  dataTestId,
}: ErrorWarningProps) => {
  const detailsId = useId()
  const { backgroundClass, colorClass, Icon } = WARNING_STYLES[type]
  const [expanded, setExpanded] = useState(false)

  if (!desc) {
    return (
      <HStack
        className={cn('items-start gap-2 rounded-2xl px-3 py-2', backgroundClass, colorClass, className)}
        style={customStyle}
        data-testid={dataTestId}
        data-warning-type={type}
      >
        <Icon size={16} className="shrink-0" />
        <div className="flex-1 text-xs font-medium italic text-text-60">{title}</div>
        {action}
      </HStack>
    )
  }

  return (
    <Stack
      className={cn('rounded-2xl px-3 py-2', backgroundClass, className)}
      style={customStyle}
      data-testid={dataTestId}
      data-warning-type={type}
    >
      <HStack
        className={cn('group cursor-pointer select-none items-start gap-2', colorClass)}
        onClick={event => {
          const target = event.target
          if (
            target instanceof Element &&
            target.closest('a, button, input, select, textarea, [role="button"], [role="link"]')
          ) {
            return
          }
          setExpanded(value => !value)
        }}
      >
        <Icon size={16} className="shrink-0" />
        <div className="flex-1 text-xs font-medium italic text-text-60">{title}</div>
        {action}
        <IconButton
          variant="compact"
          size={16}
          aria-label="Toggle warning details"
          aria-controls={detailsId}
          aria-expanded={expanded}
          data-expanded={expanded}
          className="p-0 text-text-60 transition-transform duration-200 ease-in-out group-hover:text-text data-[expanded=true]:rotate-180"
          onClick={() => setExpanded(value => !value)}
        >
          <ChevronDown size={14} />
        </IconButton>
      </HStack>

      <div
        id={detailsId}
        aria-hidden={!expanded}
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
