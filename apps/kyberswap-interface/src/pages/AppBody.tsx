import React from 'react'

import { cn } from 'utils/cn'

export const BodyWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'relative mt-5 w-full max-w-[425px] rounded-[20px] bg-background px-6 pb-6 pt-8',
      'shadow-[0_0_1px_rgba(0,0,0,0.01),0_4px_8px_rgba(0,0,0,0.04),0_16px_24px_rgba(0,0,0,0.04),0_24px_32px_rgba(0,0,0,0.01)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <BodyWrapper className={className}>{children}</BodyWrapper>
}
