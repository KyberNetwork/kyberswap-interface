import { type HTMLAttributes, type ReactNode } from 'react'

import { RightPanelWrapper } from 'components/swapv2/styleds'
import { BodyWrapper } from 'pages/AppBody'
import { cn } from 'utils/cn'

export const TradeBody = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <BodyWrapper
      className={cn('mt-0 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight', className)}
      {...rest}
    >
      {children}
    </BodyWrapper>
  )
}

export const RightPanel = ({ children }: { children: ReactNode }) => {
  const content = Array.isArray(children) ? children : [children]
  return content.filter(Boolean).length ? <RightPanelWrapper>{children}</RightPanelWrapper> : null
}

export const BannerWrapper = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 overflow-hidden max-lg:hidden', className)}
    {...rest}
  >
    {children}
  </div>
)
