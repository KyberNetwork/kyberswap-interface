import { Trans, t } from '@lingui/macro'
import { ChevronDown, X } from 'react-feather'

import { ReactComponent as RecipientWalletIcon } from 'assets/svg/recipient_wallet.svg'
import { AddressInput } from 'components/AddressInputPanel'
import { Collapse } from 'components/Collapse'
import { Stack } from 'components/Stack'
import type { RecipientAddressType } from 'components/SwapForm/hooks/useEvmRecipient'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'

type RecipientInputProps = {
  value: string
  expanded: boolean
  hideLabel?: boolean
  error?: boolean
  onChange: (value: string) => void
  onToggle: () => void
} & RecipientAddressType

export const RecipientToggle = ({ expanded, onToggle }: Pick<RecipientInputProps, 'expanded' | 'onToggle'>) => (
  <MouseoverTooltip text={t`Send to another wallet`} placement="top" width="max-content">
    <button
      type="button"
      aria-label={t`Recipient`}
      aria-expanded={expanded}
      onClick={onToggle}
      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-subText/[0.08] p-0 text-subText hover:bg-subText/[0.12]"
    >
      <RecipientWalletIcon aria-hidden="true" />
    </button>
  </MouseoverTooltip>
)

/** Shared recipient UI. Collapsing only changes visibility; the form owns the receiving address. */
export const RecipientInput = (props: RecipientInputProps) => {
  const { value, expanded, hideLabel, error, onChange, onToggle } = props
  const networkName = props.mode === 'evm' ? 'EVM' : props.networkName

  return (
    <Stack>
      {!hideLabel && (
        <div className="flex min-h-5 items-end justify-between text-xs text-subText">
          <button
            type="button"
            aria-expanded={expanded}
            className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-subText hover:brightness-125"
            onClick={onToggle}
          >
            {props.mode === 'evm' ? <Trans>Recipient (EVM address)</Trans> : <Trans>Send to other wallet</Trans>}
            <ChevronDown size={14} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
          </button>
        </div>
      )}
      <Collapse open={expanded} className="relative z-10 w-full" contentGap={2}>
        <RecipientAddressInput
          {...(props.mode === 'evm' ? { mode: 'evm' as const } : { mode: 'nonEvm' as const, networkName })}
          value={value}
          error={error}
          disabled={!expanded}
          placeholder={hideLabel ? undefined : t`Enter ${networkName} receiving address`}
          onChange={onChange}
        />
      </Collapse>
    </Stack>
  )
}

type RecipientAddressInputProps = RecipientAddressType & {
  value: string
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

export const RecipientAddressInput = (props: RecipientAddressInputProps) => {
  const { value, error, disabled, autoFocus, placeholder, onChange } = props
  const networkName = props.mode === 'evm' ? 'EVM' : props.networkName
  return (
    <AddressInput
      autoFocus={autoFocus}
      className="[&>div]:py-2"
      placeholder={placeholder ?? t`Recipient (${networkName} address)`}
      value={value}
      error={error}
      disabled={disabled}
      pattern={props.mode === 'nonEvm' ? null : undefined}
      onChange={event => onChange(event.target.value.replace(/\s+/g, ''))}
      icon={
        value ? (
          <button
            type="button"
            aria-label={t`Clear address`}
            className="flex shrink-0 items-center border-0 bg-transparent p-0 text-subText hover:text-text"
            onClick={() => onChange('')}
          >
            <X size={14} />
          </button>
        ) : undefined
      }
    />
  )
}
