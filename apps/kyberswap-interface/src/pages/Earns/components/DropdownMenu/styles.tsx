import { type CSSProperties, forwardRef } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { cn } from 'utils/cn'

export const DropdownTitleWrapper = ({
  children,
  className,
  flatten,
  highlight,
  background,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  flatten?: boolean
  highlight?: boolean
  background?: string
}) => (
  <div
    style={{ background: highlight ? undefined : background }}
    className={cn(
      'flex w-full cursor-pointer items-center justify-center rounded-[30px] text-sm transition-[filter] duration-200 ease-linear',
      flatten ? 'border border-solid px-1.5 py-0' : 'border-0 px-3 py-1.5',
      highlight
        ? flatten
          ? 'border-primary bg-primary-20 text-text'
          : 'bg-blue/[0.2] border-transparent text-text'
        : `border-transparent ${!background ? 'bg-background' : ''} text-subText`,
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

type DropdownWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  mobileFullWidth: boolean
  mobileHalfWidth: boolean
  fullWidth?: boolean
}

export const DropdownWrapper = forwardRef<HTMLDivElement, DropdownWrapperProps>(
  ({ children, className, mobileFullWidth, mobileHalfWidth, fullWidth, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative',
        fullWidth ? 'w-full min-w-0 flex-1' : 'w-fit min-w-fit flex-initial',
        mobileFullWidth && 'max-sm:w-full',
        mobileHalfWidth && 'max-sm:w-[calc(50%-4px)]',
        'hover:[&>div]:brightness-110',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
)
DropdownWrapper.displayName = 'DropdownWrapper'

export const DropdownTitle = ({
  children,
  className,
  width,
  justifyContent,
  fullWidth,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  width?: number
  justifyContent?: string
  fullWidth?: boolean
}) => (
  <div
    style={{
      width: width ? `${width}px` : fullWidth ? '100%' : 'auto',
      minWidth: fullWidth ? '0' : !width ? '100px' : 'max-content',
      justifyContent: justifyContent || 'flex-start',
    }}
    className={cn(
      'flex items-center gap-1.5 capitalize',
      fullWidth ? 'flex-1' : 'flex-[0_0_auto]',
      !fullWidth && 'max-[500px]:min-w-max',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const DropdownLabel = ({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('block min-w-0 max-w-full truncate [text-align:inherit]', className)} {...rest}>
    {children}
  </span>
)

export const DropdownIcon = ({
  className,
  $flatten,
  open,
  ...rest
}: React.SVGProps<SVGSVGElement> & { $flatten?: boolean; open: boolean }) => (
  <DropdownSVG
    className={cn(
      'transition-transform duration-300',
      open ? 'rotate-180' : 'rotate-0',
      $flatten && '-mx-1.5',
      className,
    )}
    {...rest}
  />
)

export const ItemIcon = ({ className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  // eslint-disable-next-line jsx-a11y/alt-text
  <img className={cn('h-[18px] w-[18px]', className)} {...rest} />
)

type DropdownContentWrapperProps = React.HTMLAttributes<HTMLDivElement> & { flatten?: boolean }

export const DropdownContentWrapper = forwardRef<HTMLDivElement, DropdownContentWrapperProps>(
  ({ children, className, flatten, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute left-0 z-[100] flex flex-col rounded-[18px] bg-background py-1 shadow-[0_8px_12px_var(--ks-shadow)] brightness-110',
        flatten ? 'top-8' : 'top-[42px]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
)
DropdownContentWrapper.displayName = 'DropdownContentWrapper'

export const ScrollIndicator = ({
  children,
  className,
  $visible,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { $visible: boolean }) => (
  <div
    className={cn(
      'flex shrink-0 cursor-pointer items-center justify-center overflow-hidden text-subText transition-[height,opacity] duration-150 ease-linear hover:text-text',
      $visible ? 'pointer-events-auto h-5 opacity-100' : 'pointer-events-none h-0 opacity-0',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

type DropdownContentProps = React.HTMLAttributes<HTMLDivElement> & {
  alignItems?: CSSProperties['alignItems']
  standalone?: boolean
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ children, className, alignItems, standalone, ...rest }, ref) => (
    <div
      ref={ref}
      style={{ alignItems: alignItems || 'flex-start' }}
      className={cn(
        'flex max-h-[400px] w-max flex-col gap-1 overflow-y-auto px-2 py-1 text-sm text-text',
        standalone &&
          'absolute left-0 top-[42px] z-[100] rounded-[18px] bg-background p-2 shadow-[0_8px_12px_var(--ks-shadow)] brightness-110',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
)
DropdownContent.displayName = 'DropdownContent'

export const DropdownContentItem = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 capitalize hover:bg-tableHeader [&.selected]:bg-primary-20 [&.selected]:text-primary',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const MultiSelectDropdownContentItem = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <DropdownContentItem className={cn('justify-between', className)} {...rest}>
    {children}
  </DropdownContentItem>
)
