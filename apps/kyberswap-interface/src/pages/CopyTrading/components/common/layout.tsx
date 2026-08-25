import { type HTMLAttributes, type PropsWithChildren, type ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack, type StackProps } from 'components/Stack'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'

type CopyTradingPageBackTo = {
  label: string
  to: string
}

type CopyTradingPageProps = PropsWithChildren<{
  backTo?: CopyTradingPageBackTo
  className?: string
}>

type CopyTradingPageHeadingProps = {
  className?: string
  description?: ReactNode
  title: ReactNode
}

type ContentPanelProps = PropsWithChildren<{
  bodyClassName?: string
  className?: string
  headerAside?: ReactNode
  title: string
  titleAddon?: ReactNode
}>

type ResponsiveDetailOrder = 1 | 2 | 3 | 4 | 5 | 6

type ResponsiveDetailItemProps = HTMLAttributes<HTMLDivElement> & {
  fullWidth?: boolean
  responsiveOrder?: ResponsiveDetailOrder
}

const responsiveDetailOrderClassName: Record<ResponsiveDetailOrder, string> = {
  1: 'max-xl:order-1',
  2: 'max-xl:order-2',
  3: 'max-xl:order-3',
  4: 'max-xl:order-4',
  5: 'max-xl:order-5',
  6: 'max-xl:order-6',
}

export const CopyTradingPage = ({ children, backTo, className }: CopyTradingPageProps) => {
  const navigate = useNavigate()

  return (
    <Stack as="main" className={cn('w-full min-w-0 flex-1 gap-4 px-8 pb-20 pt-6 max-lg:px-4 max-lg:pt-4', className)}>
      {backTo && (
        <div className="w-fit max-lg:hidden">
          <ButtonEmpty
            type="button"
            onClick={() => navigate(backTo.to)}
            padding="0"
            className="text-subText hover:text-text"
          >
            <HStack className="items-center gap-2">
              <ArrowLeft size={16} />
              Back to {backTo.label}
            </HStack>
          </ButtonEmpty>
        </div>
      )}
      {children}
    </Stack>
  )
}

export const CopyTradingPageHeading = ({ className, description, title }: CopyTradingPageHeadingProps) => (
  <Stack className={cn('gap-2', className)}>
    <h1 className="text-2xl font-medium text-text">{title}</h1>
    {description && <p className="text-base text-subText">{description}</p>}
  </Stack>
)

/** Two-column detail layout that stacks and supports content reordering below xl. */
export const ResponsiveDetailGrid = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1', className)} {...props} />
)

/** Removes a grouping wrapper below xl so its items can participate in the parent grid order. */
export const ResponsiveDetailContents = ({ className, ...props }: StackProps) => (
  <Stack className={cn('gap-4 max-xl:contents', className)} {...props} />
)

/** Owns responsive ordering while keeping each screen's content priority explicit. */
export const ResponsiveDetailItem = ({
  className,
  fullWidth = false,
  responsiveOrder,
  ...props
}: ResponsiveDetailItemProps) => (
  <div
    className={cn(
      'min-w-0',
      fullWidth && 'col-span-full',
      responsiveOrder && responsiveDetailOrderClassName[responsiveOrder],
      className,
    )}
    {...props}
  />
)

export const StickySideColumn = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <aside className={cn('sticky top-4 self-start max-xl:contents', className)}>{children}</aside>
)

export const ContentPanel = ({
  bodyClassName,
  children,
  className,
  headerAside,
  title,
  titleAddon,
}: ContentPanelProps) => (
  <Stack className={cn('overflow-hidden rounded-xl bg-buttonBlack-60', className)}>
    <HStack className="flex-wrap items-center justify-between gap-4 border-b border-tableHeader bg-background-60 px-6 py-3">
      <HStack className="items-center gap-2">
        <h2 className="text-base font-medium text-text">{title}</h2>
        {titleAddon}
      </HStack>
      {headerAside}
    </HStack>
    <Stack className={cn('gap-0', bodyClassName)}>{children}</Stack>
  </Stack>
)

export const ShortenedId = ({ value }: { value?: string }) => (
  <span className="whitespace-nowrap" title={value}>
    {value ? shortenHash(value, 3) : '—'}
  </span>
)
