import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type RowProps = HTMLAttributes<HTMLDivElement>

const makeRow = (baseClassName: string, displayName: string) => {
  const Component = forwardRef<HTMLDivElement, RowProps>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cn(baseClassName, className)} {...rest} />
  ))
  Component.displayName = displayName
  return Component
}

const Row = makeRow('flex w-full items-center', 'Row')
export default Row

export const RowBetween = makeRow('flex w-full items-center justify-between', 'RowBetween')
export const AutoRow = makeRow('flex flex-wrap items-center', 'AutoRow')
export const RowFixed = makeRow('flex w-fit items-center', 'RowFixed')
export const RowFit = makeRow('flex w-fit items-center', 'RowFit')
