import { cva } from 'class-variance-authority'
import { type ReactNode } from 'react'

import { cn } from 'utils/cn'

export type SegmentedControlOption<T extends string = string> = {
  label: ReactNode
  value: T
  disabled?: boolean
  dataTestId?: string
}

type SegmentedControlProps<T extends string> = {
  color?: 'default' | 'primary'
  onChange?: (value: T) => void
  options?: readonly SegmentedControlOption<T>[]
  size?: 'xs' | 'sm' | 'md'
  value?: T
}

const segment = cva(
  'relative z-[1] cursor-pointer rounded-full border-0 bg-transparent font-medium [transition:color_200ms_ease,background_200ms_ease] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'min-w-0 px-2 py-1 text-xs',
        sm: 'min-w-12 px-2 py-1 text-sm',
        md: 'min-w-12 px-3 py-2 text-sm',
      },
      active: {
        true: 'text-text',
        false: 'text-subText hover:bg-buttonGray',
      },
    },
    defaultVariants: {
      size: 'md',
      active: false,
    },
  },
)

const SegmentedControl = <T extends string>({
  color = 'default',
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
      className={cn(
        'relative grid items-center rounded-full border bg-background',
        color === 'primary' ? 'border-white-08' : 'border-border',
      )}
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
      role="tablist"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 rounded-full [transition:transform_200ms_ease,background_200ms_ease]',
          color === 'primary' ? 'border border-green2 bg-primary-20' : 'bg-tabActive',
        )}
        style={{
          width: `calc((100% - 0px) / ${optionCount})`,
          transform: `translateX(calc(100% * ${Math.max(activeIndex, 0)}))`,
        }}
      />
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            aria-selected={active}
            data-testid={option.dataTestId}
            disabled={option.disabled || !onChange}
            onClick={() => !option.disabled && onChange?.(option.value)}
            role="tab"
            type="button"
            className={cn(segment({ size, active }), color === 'primary' && !active && 'hover:bg-primary-10')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
