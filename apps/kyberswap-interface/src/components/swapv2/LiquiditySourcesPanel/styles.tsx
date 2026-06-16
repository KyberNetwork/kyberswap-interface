import { HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export const Source = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-tabActive',
      className,
    )}
    {...props}
  />
)

export const ImageWrapper = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex size-6 shrink-0 items-center [&_img]:h-auto [&_img]:w-full', className)} {...props} />
)

export const SourceName = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm font-normal leading-5 text-text', className)} {...props} />
)
