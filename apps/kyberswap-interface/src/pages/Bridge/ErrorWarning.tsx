import { CSSProperties, ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { CollapseItem } from 'components/Collapse'
import { cn } from 'utils/cn'

const ErrorWarningPanel = ({
  title,
  type,
  desc,
  style: customStyle = {},
}: {
  title: ReactNode
  type: 'error' | 'warn'
  desc?: ReactNode
  style?: CSSProperties
}) => {
  const isError = type === 'error'
  const bgClass = isError ? 'bg-red-25' : 'bg-warning-25'
  const colorClass = isError ? 'text-red' : 'text-warning'

  if (!desc)
    return (
      <div
        className={cn('flex min-h-[40px] items-center gap-2 rounded-[18px] px-3 py-2', bgClass, colorClass)}
        style={customStyle}
      >
        <AlertTriangle size={16} className="min-w-4" />
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
            <AlertTriangle size={16} className="min-w-4" />
          </div>
          <span className="text-xs font-medium text-text">{title}</span>
        </div>
      }
    >
      {desc && <div className="ml-[22px] text-xs">{desc}</div>}
    </CollapseItem>
  )
}
export default ErrorWarningPanel
