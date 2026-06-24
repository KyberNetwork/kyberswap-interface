import { Trans } from '@lingui/macro'
import { KeyboardEvent, ReactNode } from 'react'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { GasStation } from 'components/Icons'
import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import { DOCS_LINKS } from 'components/LimitOrder/helpers'
import { CancelOrderType } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export const CancelOptionNote = ({ children, href }: { children: ReactNode; href: string }) => (
  <Stack className="text-xs text-subText">
    <span>{children}</span>
    <ExternalLink href={href} className="w-fit whitespace-nowrap">
      <Trans>Learn more ↗︎</Trans>
    </ExternalLink>
  </Stack>
)

type CancelOption = {
  title: ReactNode
  disabled?: boolean
}

type GaslessCancelOption = CancelOption & {
  chainSupport: boolean
  orderSupport: boolean
}

type CancelOptionCardProps = {
  selected: boolean
  disabled?: boolean
  readOnly?: boolean
  icon: ReactNode
  title: ReactNode
  children: ReactNode
  onSelect: () => void
}

const CancelOptionCard = ({ selected, disabled, readOnly, icon, title, children, onSelect }: CancelOptionCardProps) => {
  const handleSelect = () => {
    if (disabled || readOnly) return
    onSelect()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || readOnly || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    handleSelect()
  }

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled || readOnly ? -1 : 0}
      className={cn(
        'flex w-full gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
        selected ? 'border-primary-50 bg-primary-20' : 'border-border bg-transparent',
        disabled ? 'cursor-not-allowed opacity-50' : readOnly ? 'cursor-default' : 'cursor-pointer',
        !disabled && !readOnly && !selected && 'hover:border-primary-40 hover:bg-primary/5',
      )}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <span className={cn('shrink-0', selected ? 'text-primary' : 'text-subText')}>
        {selected ? <RadioButtonChecked size={18} className="text-primary" /> : <RadioButtonUnchecked size={18} />}
      </span>
      <Stack className="min-w-0 gap-2">
        <HStack className="min-w-0 items-center gap-2 text-sm font-medium text-text">
          <span className="shrink-0">{icon}</span>
          <span className="min-w-0 truncate">{title}</span>
        </HStack>
        {children}
      </Stack>
    </div>
  )
}

type CancelButtonsProps = {
  value: CancelOrderType
  gasless?: GaslessCancelOption
  hard: CancelOption
  gasAmountDisplay: string
  readOnly?: boolean
  onChange: (type: CancelOrderType) => void
}

const CancelButtons = ({ value, gasless, hard, gasAmountDisplay, readOnly, onChange }: CancelButtonsProps) => {
  const gaslessSupport = gasless?.chainSupport && gasless.orderSupport

  const gaslessDescription = !gasless?.chainSupport ? (
    <Trans>This chain is not supported gasless cancel. It&apos;s coming soon.</Trans>
  ) : !gasless.orderSupport ? (
    <Trans>This order is not supported gasless cancel. Because it was created by our old contract.</Trans>
  ) : (
    <Trans>Cancel without paying gas. Cancellation may not be instant.</Trans>
  )

  return (
    <Stack className="gap-3" role="radiogroup">
      {gasless && (
        <CancelOptionCard
          selected={value === CancelOrderType.GAS_LESS_CANCEL}
          disabled={gasless.disabled}
          readOnly={readOnly}
          icon={<GasLessIcon />}
          title={gasless.title}
          onSelect={() => onChange(CancelOrderType.GAS_LESS_CANCEL)}
        >
          {gaslessSupport ? (
            <CancelOptionNote href={DOCS_LINKS.GASLESS_CANCEL}>{gaslessDescription}</CancelOptionNote>
          ) : (
            <span className="text-xs text-subText">{gaslessDescription}</span>
          )}
        </CancelOptionCard>
      )}

      <CancelOptionCard
        selected={value === CancelOrderType.HARD_CANCEL}
        disabled={hard.disabled}
        readOnly={readOnly}
        icon={<GasStation size={20} />}
        title={hard.title}
        onSelect={() => onChange(CancelOrderType.HARD_CANCEL)}
      >
        <CancelOptionNote href={DOCS_LINKS.HARD_CANCEL}>
          <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>
        </CancelOptionNote>
      </CancelOptionCard>
    </Stack>
  )
}

export default CancelButtons
