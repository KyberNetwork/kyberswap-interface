import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

export default function DelegateConfirmModal({
  address,
  isUndelegate,
  delegatedAddress,
  onAddressChange,
  delegateCallback,
}: {
  address: string
  isUndelegate?: boolean
  delegatedAddress: string
  onAddressChange: (address: string) => void
  delegateCallback: () => void
}) {
  const modalOpen = useModalOpen(ApplicationModal.DELEGATE_CONFIRM)
  const toggleModal = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)

  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={90} maxWidth={500}>
      <div className="p-6">
        <AutoColumn gap="20px">
          <RowBetween>
            <span className="text-xl">{isUndelegate ? <Trans>Undelegate</Trans> : <Trans>Delegate</Trans>}</span>
            <div role="button" onClick={toggleModal} className="flex cursor-pointer">
              <X onClick={toggleModal} size={20} className="text-subText" />
            </div>
          </RowBetween>
          <span className="text-base leading-6 text-subText">
            {isUndelegate ? (
              <Trans>You are undelegating your voting power from this address</Trans>
            ) : (
              <Trans>
                You are delegating your voting power to this address. Your stake balance will remain the same. The
                delegated address will be responsible for the transaction fee The delegated wallet will be able to vote
                from the <span className="text-text">next epoch</span> onward
              </Trans>
            )}
          </span>
          <input
            placeholder={t`Ethereum Address`}
            value={isUndelegate ? delegatedAddress : address}
            onChange={e => onAddressChange(e.target.value)}
            disabled
            className="rounded-[20px] border-0 bg-buttonBlack px-3 py-2.5 text-sm text-subText outline-none"
          />
          <RowBetween gap="24px">
            <ButtonOutlined onClick={toggleModal}>
              <span className="text-sm leading-5">
                <Trans>Cancel</Trans>
              </span>
            </ButtonOutlined>
            <ButtonPrimary onClick={delegateCallback}>
              <span className="text-sm leading-5">
                <Trans>Confirm</Trans>
              </span>
            </ButtonPrimary>
          </RowBetween>
        </AutoColumn>
      </div>
    </Modal>
  )
}
