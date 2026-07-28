import { type CSSProperties, type ReactNode } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { CollapseItem } from 'components/Collapse'
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
}

export const ErrorWarning = ({ title, type, desc, style: customStyle = {} }: ErrorWarningProps) => {
  const { backgroundClass, colorClass, Icon } = WARNING_STYLES[type]

  if (!desc) {
    return (
      <div
        className={cn('flex min-h-[40px] items-center gap-2 rounded-[18px] px-3 py-2', backgroundClass, colorClass)}
        style={customStyle}
      >
        <Icon size={16} className="min-w-4" />
        <span className="text-xs font-normal text-text">{title}</span>
      </div>
    )
  }

  return (
    <CollapseItem
      arrowComponent={<DropdownSVG className="-mr-2" />}
      style={{ gap: '8px', borderRadius: '18px', padding: '8px 12px', ...customStyle }}
      className={backgroundClass}
      header={
        <div className={cn('flex items-center gap-2', colorClass)}>
          <div>
            <Icon size={16} className="min-w-4" />
          </div>
          <span className="text-xs font-medium text-text">{title}</span>
        </div>
      }
    >
      <div className="ml-[22px] text-xs">{desc}</div>
    </CollapseItem>
  )
}
