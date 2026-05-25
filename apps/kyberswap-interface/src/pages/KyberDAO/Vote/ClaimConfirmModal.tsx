import { Trans } from '@lingui/macro'
import { X } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import KNCLogo from '../kncLogo'

export default function ClaimConfirmModal({ amount, onConfirmClaim }: { amount: string; onConfirmClaim: () => void }) {
  const { account } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <div className="flex flex-col gap-5 p-6">
        <RowBetween>
          <AutoRow className="gap-0.5">
            <span className="text-xl">
              <Trans>Claim your KNC rewards</Trans>
            </span>
          </AutoRow>
          <div role="button" onClick={toggleModal} className="flex cursor-pointer">
            <X onClick={toggleModal} size={20} className="text-subText" />
          </div>
        </RowBetween>
        <div className="flex flex-col gap-3.5 rounded-lg border-0 bg-buttonBlack px-3 py-2.5 text-sm text-subText outline-none">
          <span className="text-xs">
            <Trans>Your wallet address</Trans>
          </span>
          <span className="text-border">{account}</span>
        </div>
        <span className="text-base font-normal leading-6 text-text">
          <Trans>If your wallet is eligible, you will be able to claim your reward below:</Trans>
        </span>
        <RowFit className="gap-2.5">
          <KNCLogo size={28} /> <span className="text-[32px]">{amount} KNC</span>
        </RowFit>
        <ButtonPrimary onClick={onConfirmClaim}>Claim</ButtonPrimary>
      </div>
    </Modal>
  )
}
