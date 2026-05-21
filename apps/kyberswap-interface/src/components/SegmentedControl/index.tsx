import { type ReactNode } from 'react'

import { cn } from 'utils/cn'

export type SegmentedControlOption<T extends string = string> = {
  label: ReactNode
  value: T
  disabled?: boolean
}

type SegmentedControlProps<T extends string> = {
  onChange?: (value: T) => void
  options?: readonly SegmentedControlOption<T>[]
  size?: 'sm' | 'md'
  value?: T
}

const SegmentedControl = <T extends string>({
  onChange,
  options = [],
  size = 'md',
  value,
}: SegmentedControlProps<T>) => {
  if (!options.length) return null

  const activeIndex = options.findIndex(option => option.value === value)
  const optionCount = options.length

  return (
    <div
      className="relative grid items-center rounded-full border border-border bg-background"
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
      role="tablist"
    >
      <div
        className="pointer-events-none absolute inset-y-px left-px rounded-full bg-tabActive [transition:transform_200ms_ease,background_200ms_ease]"
        style={{
          width: `calc((100% - 2px) / ${optionCount})`,
          transform: `translateX(calc(100% * ${Math.max(activeIndex, 0)}))`,
        }}
      />
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            aria-selected={active}
            disabled={option.disabled || !onChange}
            onClick={() => !option.disabled && onChange?.(option.value)}
            role="tab"
            type="button"
            className={cn(
              'relative z-[1] min-w-12 rounded-full border-0 bg-transparent text-sm font-medium [transition:color_200ms_ease,background_200ms_ease] disabled:cursor-not-allowed disabled:opacity-50',
              active ? 'text-text' : 'cursor-pointer text-subText hover:bg-buttonGray',
              size === 'sm' ? 'px-2 py-1' : 'px-3 py-2',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
