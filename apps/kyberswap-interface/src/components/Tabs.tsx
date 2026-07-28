import { CSSProperties, FC, ReactNode } from 'react'

import HorizontalScroll from 'components/HorizontalScroll'
import { cn } from 'utils/cn'

interface TabsProps {
  activeKey: string | number
  items: Array<{
    key: string | number
    label: string | ReactNode
    children: ReactNode
  }>
  onChange: (activeKey: string | number) => void
  className?: string
  horizontalWrapperStyle?: CSSProperties
  tabItemStyle?: CSSProperties
  tabItemActiveStyle?: CSSProperties
}

const Tabs: FC<TabsProps> = ({
  activeKey,
  items,
  className,
  onChange,
  horizontalWrapperStyle = {},
  tabItemStyle = {},
  tabItemActiveStyle = {},
}) => {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-[20px] bg-buttonBlack', className)}>
      <div className="flex overflow-y-scroll border-b border-border">
        <HorizontalScroll
          style={{ gap: 0, ...horizontalWrapperStyle }}
          items={items.map(item => item.key.toString())}
          renderItem={key => {
            const isActive = +key === +activeKey
            const label = items.find(i => +i.key === +key)?.label || ''
            return (
              <div
                onClick={() => onChange(key)}
                className={cn(
                  'flex cursor-pointer border-r border-border p-2 text-xs font-medium',
                  isActive ? 'bg-primary-30 text-primary' : 'bg-buttonBlack text-subText',
                )}
                style={isActive ? tabItemActiveStyle : tabItemStyle}
              >
                {label}
              </div>
            )
          }}
        />
      </div>
      {items.find(item => item.key === activeKey)?.children}
    </div>
  )
}

export default Tabs
