import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

import { cn } from 'utils/cn'

export type SegmentedControlOption<T extends string = string> = {
  label: ReactNode
  value: T
  disabled?: boolean
  dataTestId?: string
  trailingAction?: ReactNode
}

type SegmentedControlProps<T extends string> = {
  color?: 'default' | 'primary'
  equalWidth?: boolean
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
        false: 'text-subText',
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
  equalWidth = true,
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
      style={{ gridTemplateColumns: `repeat(${optionCount}, ${equalWidth ? 'minmax(0, 1fr)' : 'max-content'})` }}
      role="tablist"
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.2, ease: 'easeInOut' } }}
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-full rounded-full [transition:background_200ms_ease]',
          color === 'primary' ? 'border border-green2 bg-primary-20' : 'bg-tabActive',
        )}
        style={{
          gridColumn: `${Math.max(activeIndex, 0) + 1} / span 1`,
        }}
      />
      {options.map(option => {
        const active = option.value === value
        const disabled = option.disabled || !onChange

        return (
          <div
            key={option.value}
            className={cn(
              'relative z-[1] flex min-w-0 items-center rounded-full transition-colors',
              !active && !disabled && (color === 'primary' ? 'hover:bg-primary-10' : 'hover:bg-buttonGray'),
              option.trailingAction && ['gap-2', size === 'md' ? 'px-4' : 'px-2'],
            )}
          >
            <button
              aria-selected={active}
              data-testid={option.dataTestId}
              disabled={disabled}
              onClick={() => !option.disabled && onChange?.(option.value)}
              role="tab"
              type="button"
              className={cn(segment({ size, active }), 'flex-1', option.trailingAction && 'min-w-0 px-0')}
            >
              {option.label}
            </button>
            {option.trailingAction && <div className="flex shrink-0 items-center">{option.trailingAction}</div>}
          </div>
        )
      })}
    </div>
  )
}

export default SegmentedControl
