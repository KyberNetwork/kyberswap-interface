import { Trans, t } from '@lingui/macro'
import { ChevronDown, X } from 'react-feather'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type RecipientInputProps = {
  value: string
  expanded: boolean
  error?: boolean
  onChange: (value: string) => void
  onToggle: () => void
  onUseMyWallet?: () => void
} & ({ mode: 'evm' } | { mode: 'nonEvm'; networkName: string })

/** Shared recipient UI. Collapsing only changes visibility; the form owns the receiving address. */
export const RecipientInput = (props: RecipientInputProps) => {
  const { value, expanded, error, onChange, onToggle, onUseMyWallet } = props
  const networkName = props.mode === 'evm' ? 'EVM' : props.networkName

  return (
    <Stack>
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
      <div
        aria-hidden={!expanded}
        className={cn(
          'relative z-10 grid w-full transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2">
            <AddressInput
              className="[&>div]:py-2"
              placeholder={t`Enter ${networkName} receiving address`}
              value={value}
              error={error}
              disabled={!expanded}
              pattern={props.mode === 'nonEvm' ? null : undefined}
              icon={
                expanded && value ? (
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
              onChange={event => onChange(event.target.value.replace(/\s+/g, ''))}
            />
          </div>
        </div>
      </div>
    </Stack>
  )
}
