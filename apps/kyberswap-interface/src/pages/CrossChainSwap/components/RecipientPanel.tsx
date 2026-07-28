import { Trans, t } from '@lingui/macro'
import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { ChevronDown } from 'react-feather'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Chain, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { cn } from 'utils/cn'

type RecipientPanelProps = {
  account?: string
  btcAddress?: string | null
  fromChainId: Chain
  nearAccountId?: string | null
  recipient: string
  setRecipient: (value: string) => void
  setShowEvmRecipient: Dispatch<SetStateAction<boolean>>
  showEvmRecipient: boolean
  toChainId?: Chain
}

export const RecipientPanel = ({
  account,
  btcAddress,
  fromChainId,
  nearAccountId,
  recipient,
  setRecipient,
  setShowEvmRecipient,
  showEvmRecipient,
  toChainId,
}: RecipientPanelProps) => {
  const isToNear = toChainId === NonEvmChain.Near
  const isToBtc = toChainId === NonEvmChain.Bitcoin
  const isToEvm = Boolean(toChainId && isEvmChain(toChainId))
  const isToSolana = toChainId === NonEvmChain.Solana
  const networkName = isToNear ? 'NEAR' : isToBtc ? 'Bitcoin' : isToSolana ? 'Solana' : 'EVM'
  const isEvmRecipientToggle = isEvmChain(fromChainId) && isToEvm
  const showRecipientInput = isEvmRecipientToggle ? showEvmRecipient : true
  const inputRecipient = showRecipientInput ? recipient : ''

  const isDifferentRecipient = isToNear
    ? nearAccountId && recipient !== nearAccountId
    : isToEvm
    ? account && recipient !== account
    : isToBtc
    ? btcAddress && btcAddress !== recipient
    : false

  return (
    <AutoColumn>
      <div className="flex min-h-5 items-end justify-between text-xs text-subText">
        <div
          className={cn('flex w-fit items-end gap-1 text-subText', isEvmRecipientToggle && 'cursor-pointer')}
          role={isEvmRecipientToggle ? 'button' : undefined}
          onClick={
            isEvmRecipientToggle
              ? () => {
                  if (!showEvmRecipient) {
                    setRecipient('')
                  }
                  setShowEvmRecipient(prev => !prev)
                }
              : undefined
          }
        >
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-normal text-subText',
              isEvmRecipientToggle && 'hover:brightness-125',
            )}
          >
            {isEvmRecipientToggle ? <Trans>Send to other wallet</Trans> : t`Recipient (${networkName} address)`}
          </span>
          {isEvmRecipientToggle && (
            <ChevronDown
              size={14}
              className={cn('cursor-pointer transition-transform duration-300', showEvmRecipient && 'rotate-180')}
            />
          )}
        </div>

        {toChainId && showRecipientInput && (
          <div className="flex gap-1">
            {isDifferentRecipient && (!isEvmChain(fromChainId) || !isToEvm) && (
              <ButtonLight
                padding="2px 8px"
                width="fit-content"
                style={{ fontSize: '12px' }}
                onClick={() => {
                  let recipient = ''
                  if (isToEvm) recipient = account || ''
                  if (isToNear) recipient = nearAccountId || ''
                  if (isToBtc) recipient = btcAddress || ''
                  setRecipient(recipient)
                }}
              >
                <Trans>Use my wallet</Trans>
              </ButtonLight>
            )}
          </div>
        )}
      </div>
      <div
        aria-hidden={!showRecipientInput}
        className={cn(
          'relative z-10 grid w-full transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          showRecipientInput ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2">
            <AddressInput
              placeholder={t`Enter ${networkName} receiving address`}
              value={inputRecipient}
              disabled={!showRecipientInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const input = event.target.value
                const withoutSpaces = input.replace(/\s+/g, '')
                setRecipient(withoutSpaces)
              }}
            />
          </div>
        </div>
      </div>
    </AutoColumn>
  )
}
