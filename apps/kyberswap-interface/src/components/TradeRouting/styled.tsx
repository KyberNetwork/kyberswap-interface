import { t } from '@lingui/macro'
import type { AnchorHTMLAttributes, ComponentPropsWithRef, HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export const RouteContent = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3', className)} {...rest} />
)

export const PairRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex items-center justify-between', className)} {...rest} />
)

export const PairTokenSlot = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-6 w-max min-w-[100px] items-center justify-between whitespace-nowrap rounded-lg text-base font-medium max-sm:min-w-[120px]',
      className,
    )}
    {...rest}
  />
)

type TokenLinkProps = HTMLAttributes<HTMLElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & {
    reverse?: boolean
    as?: 'a' | 'div'
  }

export const TokenLink = ({ className, reverse, as: Component = 'a', href, ...rest }: TokenLinkProps) => (
  <Component
    href={Component === 'a' ? href : undefined}
    className={cn(
      'flex w-full items-center gap-1 whitespace-nowrap text-subText no-underline',
      reverse && 'flex-row-reverse justify-start',
      className,
    )}
    {...rest}
  />
)

export const RouteList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative min-w-full px-0 pt-0', className)} {...rest} />
)

export const RouteDot = ({ out }: { out?: boolean }) => (
  <i className={cn('absolute top-0 z-[1] size-2 rounded-full bg-primary', out ? 'right-[6.5px]' : 'left-[6.5px]')} />
)

export const HopCard = ({ className, ...rest }: ComponentPropsWithRef<'div'>) => (
  <div
    className={cn(
      'relative flex h-fit min-w-[168px] shrink-0 flex-col gap-2 rounded-lg border border-white/[0.06] bg-transparent p-3',
      className,
    )}
    {...rest}
  />
)

export const PoolList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 rounded-lg bg-white/[0.06] px-3 py-2', className)} {...rest} />
)

export const EmptyRoute = ({ message = t`No route found` }: { message?: string }) => (
  <RouteList>
    <div className="pb-9">
      <div className="relative flex items-center justify-center px-12">
        <div className="absolute inset-x-2.5 top-1/2 border-t border-buttonGray" />
        <div className="relative rounded-lg border border-darkBorder bg-buttonBlack px-3 py-2 text-sm font-medium italic text-text3">
          {message}
        </div>
      </div>
    </div>
  </RouteList>
)
