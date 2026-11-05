import { type ReactNode } from 'react'
import { ArrowDown } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import { CloseIcon } from 'theme'

export const SwapReviewHeader = ({
  title,
  subtitle,
  onDismiss,
}: {
  title: ReactNode
  subtitle: ReactNode
  onDismiss?: () => void
}) => (
  <Stack className="gap-1">
    <HStack className="items-center justify-between gap-3">
      <span className="text-xl font-medium">{title}</span>
      <CloseIcon className="shrink-0" onClick={onDismiss} />
    </HStack>
    <div className="text-xs text-subText">{subtitle}</div>
  </Stack>
)

type SwapReviewAmountCardProps = {
  label: ReactNode
  headerAside?: ReactNode
  isOutput?: boolean
  children: ReactNode
}

/** Input/output cards share an 8px pair gap; the arrow sits at its midpoint. */
export const SwapReviewAmountCard = ({ label, headerAside, isOutput, children }: SwapReviewAmountCardProps) => (
  <Stack className="relative min-w-0 gap-2 rounded-2xl border border-border px-4 py-3">
    {isOutput && (
      <div
        aria-hidden
        className="absolute -top-1 left-1/2 z-[1] flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-buttonGray"
      >
        <ArrowDown size={12} className="text-subText" />
      </div>
    )}
    <HStack className="min-h-6 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-medium text-subText">
      <HStack className="items-center gap-1">{label}</HStack>
      {headerAside}
    </HStack>
    <HStack className="min-h-8 min-w-0 flex-wrap items-center justify-between gap-2">{children}</HStack>
  </Stack>
)
