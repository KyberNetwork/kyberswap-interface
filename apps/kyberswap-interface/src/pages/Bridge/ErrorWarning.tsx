import { CSSProperties, ReactNode } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { CollapseItem } from 'components/Collapse'
import { cn } from 'utils/cn'

type ErrorWarningProps = {
  title: ReactNode
  type: 'error' | 'warn' | 'info'
  desc?: ReactNode
  style?: CSSProperties
}

const ErrorWarning = ({ title, type, desc, style: customStyle = {} }: ErrorWarningProps) => {
  const isError = type === 'error'
  const isInfo = type === 'info'
  const bgClass = isError ? 'bg-red-25' : isInfo ? 'bg-primary-20' : 'bg-warning-25'
  const colorClass = isError ? 'text-red' : isInfo ? 'text-primary' : 'text-warning'
  const Icon = isInfo ? Info : AlertTriangle

  if (!desc)
    return (
      <div
        className={cn('flex min-h-[40px] items-center gap-2 rounded-[18px] px-3 py-2', bgClass, colorClass)}
        style={customStyle}
      >
        <Icon size={16} className="min-w-4" />
        <span className="text-xs font-normal text-text">{title}</span>
      </div>
    )
  return (
    <CollapseItem
      arrowComponent={<DropdownSVG className="-mr-2" />}
      style={{ gap: '8px', borderRadius: '18px', padding: '8px 12px', ...customStyle }}
      className={bgClass}
      header={
        <div className={cn('flex items-center gap-2', colorClass)}>
          <div>
            <Icon size={16} className="min-w-4" />
          </div>
          <span className="text-xs font-medium text-text">{title}</span>
        </div>
      }
    >
      {desc && <div className="ml-[22px] text-xs">{desc}</div>}
    </CollapseItem>
  )
}
export default ErrorWarning
