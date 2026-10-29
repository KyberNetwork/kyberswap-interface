import { HTMLAttributes } from 'react'

import bg from 'assets/images/earn-bg.png'
import { cn } from 'utils/cn'

export const EarnLayoutContainer = ({ className, style, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-[calc(100vh-148px)] w-full bg-[length:100%_auto] [background-repeat:repeat-y]',
      className,
    )}
    style={{ backgroundImage: `url(${bg})`, ...style }}
    {...rest}
  />
)

export const EarnContentArea = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mx-auto flex min-w-0 max-w-[1600px] flex-1 flex-col px-9 pb-7 pt-8',
      'max-md:px-6 max-md:pb-12 max-md:pt-7',
      'max-sm:px-4 max-sm:pb-10 max-sm:pt-5',
      'max-xxs:px-3 max-xxs:pb-9 max-xxs:pt-4',
      className,
    )}
    {...rest}
  />
)
