import { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as IconArrowLeft } from 'assets/svg/ic_left_arrow.svg'
import usePrefetchOnIntent from 'hooks/usePrefetchOnIntent'
import usePrefetchRoute from 'hooks/usePrefetchRoute'
import { cn } from 'utils/cn'

/** Shared page shell for listing pages and their route-level fallbacks. */
export const ListingPageWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full max-w-[1500px] flex-col gap-4 px-6 pb-16 pt-8 max-sm:px-4 max-sm:pb-[100px] max-sm:pt-6',
      className,
    )}
    {...rest}
  />
)

type ListingPageTitleProps = HTMLAttributes<HTMLDivElement> & {
  backLabel: string
  onBack: () => void
  titleAs?: 'h1' | 'h2' | 'span'
}

export const ListingPageTitle = ({
  backLabel,
  children,
  className,
  onBack,
  titleAs: Title = 'h1',
  ...rest
}: ListingPageTitleProps) => (
  <div className={cn('flex items-center gap-4', className)} {...rest}>
    <button
      type="button"
      aria-label={backLabel}
      onClick={onBack}
      className="flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-text hover:bg-tabActive"
    >
      <IconArrowLeft className="text-white2" />
    </button>
    <Title className="m-0 text-2xl font-medium">{children}</Title>
  </div>
)

type ListingPageActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  mobileFullWidth?: boolean
}

export const ListingPageActionButton = ({
  className,
  mobileFullWidth,
  type = 'button',
  ...rest
}: ListingPageActionButtonProps) => (
  <button
    type={type}
    className={cn(
      'flex w-max cursor-pointer items-center justify-center gap-2.5 rounded-xl border-0 bg-primary-20 px-4 py-2 text-sm font-medium text-text hover:brightness-125',
      mobileFullWidth && 'max-sm:w-full',
      className,
    )}
    {...rest}
  />
)

type ListingPageNavigateButtonProps = {
  icon: React.ReactNode
  text: React.ReactNode
  to: string
  mobileFullWidth?: boolean
  'data-testid'?: string
}

export const ListingPageNavigateButton = ({
  icon,
  text,
  to,
  mobileFullWidth,
  'data-testid': dataTestId,
}: ListingPageNavigateButtonProps) => {
  const navigate = useNavigate()
  const prefetchRoute = usePrefetchRoute()
  const intent = usePrefetchOnIntent(() => prefetchRoute(to))

  return (
    <ListingPageActionButton
      mobileFullWidth={mobileFullWidth}
      onClick={() => navigate({ pathname: to })}
      data-testid={dataTestId}
      {...intent}
    >
      {icon}
      <span className="w-max">{text}</span>
    </ListingPageActionButton>
  )
}

export const ListingPageDisclaimer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'absolute bottom-7 left-1/2 w-full -translate-x-1/2 px-4 text-center text-sm italic text-gray max-md:bottom-5',
      className,
    )}
    {...rest}
  />
)
