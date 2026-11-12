import { Trans, t } from '@lingui/macro'
import { useState } from 'react'

import { ReactComponent as PasteIcon } from 'assets/svg/ic_paste.svg'
import { ReactComponent as RecipientWalletIcon } from 'assets/svg/recipient_wallet.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack } from 'components/Stack'
import { RecipientAddressInput } from 'components/SwapForm/RecipientInput'
import type { RecipientAddressType } from 'components/SwapForm/hooks/useEvmRecipient'
import { useRecipientAddress } from 'components/SwapForm/hooks/useRecipientAddress'
import { SettingsAction, SettingsDivider, SettingsRow } from 'components/TransactionSettings/components'
import { CloseIcon } from 'theme/components'

type Props = RecipientAddressType & {
  disabled?: boolean
  recipientInputValue: string
  onApply: (value: string) => void
}

export const SendToAnotherWalletSetting = (props: Props) => {
  const { recipientInputValue, onApply, disabled = false } = props
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const lookup = useRecipientAddress(isOpen ? value : '', props)
  const isValid = !value || (!!lookup.address && !lookup.loading)

  const open = () => {
    setValue(recipientInputValue)
    setIsOpen(true)
  }

  const apply = () => {
    if (disabled || !isValid) return
    setIsOpen(false)
    onApply(value)
  }

  return (
    <>
      <SettingsDivider />
      <SettingsRow>
        <span className="text-sm font-medium text-text">
          <Trans>Send to another Wallet</Trans>
        </span>
        <SettingsAction
          disabled={disabled}
          onClick={open}
          aria-label={t`Send to another wallet`}
          className="size-7 items-center justify-center rounded-full bg-tableHeader text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RecipientWalletIcon aria-hidden="true" />
        </SettingsAction>
      </SettingsRow>
      <Modal
        isOpen={isOpen && !disabled}
        onDismiss={() => setIsOpen(false)}
        maxWidth="480px"
        bgColor="var(--ks-background)"
        enableInitialFocusInput
      >
        <form
          className="flex w-full flex-col gap-6 bg-background p-5"
          noValidate
          onSubmit={event => {
            event.preventDefault()
            apply()
          }}
        >
          <HStack className="items-center justify-between">
            <HStack className="items-center gap-2">
              <PasteIcon className="size-5" aria-hidden="true" />
              <span className="text-xl font-medium text-text">
                <Trans>Paste recipient address</Trans>
              </span>
            </HStack>
            <CloseIcon onClick={() => setIsOpen(false)} aria-label={t`Close`} />
          </HStack>
          <RecipientAddressInput
            {...(props.mode === 'evm'
              ? { mode: 'evm' as const }
              : { mode: 'nonEvm' as const, networkName: props.networkName })}
            autoFocus
            value={value}
            onChange={setValue}
            error={lookup.error}
          />
          <HStack className="justify-center gap-4">
            <ButtonOutlined type="button" className="flex-1 p-2.5 text-sm" onClick={() => setIsOpen(false)}>
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary type="submit" className="flex-1 p-2.5 text-sm" disabled={!isValid || disabled}>
              <Trans>Apply</Trans>
            </ButtonPrimary>
          </HStack>
        </form>
      </Modal>
    </>
  )
}
