import type { ReactNode } from 'react'

import { Center, HStack } from 'components/Stack'
import { cn } from 'utils/cn'

export type DetailTabOption<TValue extends string> = {
  badge?: ReactNode
  label: string
  shortLabel?: string
  value: TValue
}

type DetailTabBarProps<TValue extends string> = {
  activeTab: TValue
  onChange: (tab: TValue) => void
  options: readonly DetailTabOption<TValue>[]
}

/**
 * Shared responsive tab bar for Agent and Copy detail activity panels.
 */
export function DetailTabBar<TValue extends string>({ activeTab, onChange, options }: DetailTabBarProps<TValue>) {
  return (
    <HStack className="items-center border-b border-darkBorder bg-background">
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
        {options.map((option, index) => {
          const active = activeTab === option.value
          const isLast = index === options.length - 1

          return (
            <button
              key={option.value}
              aria-selected={active}
              className={cn(
                'relative flex min-h-10 min-w-0 flex-auto cursor-pointer items-center justify-center gap-1 border-0 p-2 text-sm font-medium sm:flex-none sm:gap-2 sm:px-4',
                !isLast && 'border-r border-darkBorder',
                active
                  ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                  : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
              )}
              onClick={() => onChange(option.value)}
              role="tab"
              type="button"
            >
              <span className="text-sm font-medium uppercase sm:hidden">{option.shortLabel || option.label}</span>
              <span className="hidden text-sm font-medium uppercase sm:inline">{option.label}</span>
              {option.badge !== undefined && (
                <Center
                  className={cn('h-5 min-w-5 rounded-full px-1.5 text-xs', active ? 'bg-primary-20' : 'bg-subText-20')}
                >
                  {option.badge}
                </Center>
              )}
            </button>
          )
        })}
      </div>
    </HStack>
  )
}
