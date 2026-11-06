import { Trans, t } from '@lingui/macro'
import { ChevronDown, X } from 'react-feather'

import { ReactComponent as RecipientWalletIcon } from 'assets/svg/recipient_wallet.svg'
import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { Collapse } from 'components/Collapse'
import { Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'

type RecipientInputProps = {
  value: string
  expanded: boolean
  hideLabel?: boolean
  error?: boolean
  onChange: (value: string) => void
  onToggle: () => void
  onUseMyWallet?: () => void
} & ({ mode: 'evm' } | { mode: 'nonEvm'; networkName: string })

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
  const { value, expanded, hideLabel, error, onChange, onToggle, onUseMyWallet } = props
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
          {props.mode === 'evm' && expanded && onUseMyWallet && (
            <ButtonLight type="button" className="w-fit px-2 py-0.5" fontSize={12} onClick={onUseMyWallet}>
              <Trans>Use my wallet</Trans>
            </ButtonLight>
          )}
        </div>
      )}
      <Collapse open={expanded} className="relative z-10 w-full" contentGap={2}>
        <AddressInput
          className="[&>div]:py-2"
          placeholder={hideLabel ? t`Recipient (${networkName} address)` : t`Enter ${networkName} receiving address`}
          value={value}
          error={error}
          disabled={!expanded}
          pattern={props.mode === 'nonEvm' ? null : undefined}
          icon={
            <>
              {hideLabel && props.mode === 'evm' && onUseMyWallet && (
                <ButtonLight
                  type="button"
                  className="w-fit shrink-0 whitespace-nowrap px-2 py-0.5"
                  fontSize={12}
                  onClick={onUseMyWallet}
                >
                  <Trans>Use my wallet</Trans>
                </ButtonLight>
              )}
              {value ? (
                <button
                  type="button"
                  aria-label={t`Clear address`}
                  className="flex shrink-0 items-center border-0 bg-transparent p-0 text-subText hover:text-text"
                  onClick={() => onChange('')}
                >
                  <X size={14} />
                </button>
              ) : undefined}
            </>
          }
          onChange={event => onChange(event.target.value.replace(/\s+/g, ''))}
        />
      </Collapse>
    </Stack>
  )
}
