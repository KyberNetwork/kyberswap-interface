import { type PropsWithChildren, type ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
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

export const StickySideColumn = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <aside className={cn('sticky top-4 self-start max-xl:static', className)}>{children}</aside>
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
