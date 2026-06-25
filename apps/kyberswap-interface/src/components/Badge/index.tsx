import { type VariantProps, cva } from 'class-variance-authority'
import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export enum BadgeVariant {
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
  PRIMARY = 'PRIMARY',
  WARNING = 'WARNING',

  WARNING_OUTLINE = 'WARNING_OUTLINE',
}

const badge = cva('inline-flex items-center justify-center rounded-full px-2 py-1 font-medium', {
  variants: {
    variant: {
      [BadgeVariant.NEGATIVE]: 'bg-red-20 text-red',
      [BadgeVariant.POSITIVE]: 'bg-green1 text-white',
      [BadgeVariant.PRIMARY]: 'bg-primary-20 text-primary',
      [BadgeVariant.WARNING]: 'bg-warning-20 text-warning',
      [BadgeVariant.WARNING_OUTLINE]: 'border border-warning bg-transparent text-warning',
    },
  },
  defaultVariants: {
    // No variant prop -> the historical default (full-background, light text).
    variant: undefined,
  },
})

const defaultClasses = 'bg-background text-white'

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badge>

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ variant, className, ...rest }, ref) => (
  <div ref={ref} className={cn(badge({ variant }), !variant && defaultClasses, className)} {...rest} />
))
Badge.displayName = 'Badge'
export default Badge
