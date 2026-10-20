import { Trans, t } from '@lingui/macro'
import { ChangeEvent } from 'react'
import { ChevronDown } from 'react-feather'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { useCrossChainSwap } from 'pages/Swap/hooks/crossChain/useCrossChainSwap'
import { cn } from 'utils/cn'

export const CrossChainRecipient = () => {
  const {
    toChainId,
    recipient,
    setRecipient,
    showRecipientInput,
    isEvmRecipientToggle,
    toggleRecipient,
    recipientWalletAddress,
  } = useCrossChainSwap()
  const networkName =
    toChainId === NonEvmChain.Near
      ? 'NEAR'
      : toChainId === NonEvmChain.Bitcoin
      ? 'Bitcoin'
      : toChainId === NonEvmChain.Solana
      ? 'Solana'
      : 'EVM'
  const canUseWallet =
    !isEvmRecipientToggle &&
    toChainId !== NonEvmChain.Solana &&
    recipientWalletAddress &&
    recipientWalletAddress !== recipient

  return (
    <AutoColumn>
      <div className="flex min-h-5 items-end justify-between text-xs text-subText">
        <button
          type="button"
          disabled={!isEvmRecipientToggle}
          aria-expanded={isEvmRecipientToggle ? showRecipientInput : undefined}
          className={cn(
            'flex w-fit items-end gap-1 border-0 bg-transparent p-0 text-subText disabled:cursor-default',
            isEvmRecipientToggle && 'cursor-pointer',
          )}
          onClick={toggleRecipient}
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
              className={cn('cursor-pointer transition-transform duration-300', showRecipientInput && 'rotate-180')}
            />
          )}
        </button>

        {showRecipientInput && canUseWallet && (
          <ButtonLight
            padding="2px 8px"
            width="fit-content"
            style={{ fontSize: '12px' }}
            onClick={() => setRecipient(recipientWalletAddress)}
          >
            <Trans>Use my wallet</Trans>
          </ButtonLight>
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
              value={showRecipientInput ? recipient : ''}
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
