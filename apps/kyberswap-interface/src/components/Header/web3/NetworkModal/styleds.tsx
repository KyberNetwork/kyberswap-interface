import { HTMLMotionProps, motion } from 'framer-motion'
import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export const Wrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex h-fit w-full flex-col p-5', className)} {...props} />
))
Wrapper.displayName = 'Wrapper'

export const NetworkList = ({ className, ...props }: HTMLMotionProps<'div'>) => (
  <motion.div
    className={cn(
      'flex min-h-[60px] w-full flex-wrap items-center gap-x-2 gap-y-1.5 [&>*]:w-[calc(50%-4px)]',
      'sm:gap-x-4 sm:[&>*]:w-[calc(33%-32px/3)]',
      className,
    )}
    {...props}
  />
)
