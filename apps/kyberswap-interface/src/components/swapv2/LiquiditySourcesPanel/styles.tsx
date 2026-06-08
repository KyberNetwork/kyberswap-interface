import { HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export const Source = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex h-8 w-full items-center gap-x-4 p-3', className)} {...props} />
)

export const ImageWrapper = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex size-8 items-center [&_img]:h-auto [&_img]:w-full', className)} {...props} />
)

export const SourceName = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm font-normal leading-5 text-text', className)} {...props} />
)
