import { Trans } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { KyberDAOBodyText, KyberDAOModalCloseButton, KyberDAOSectionTitle, KyberDAOValue } from 'pages/KyberDAO/common'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

export default function ClaimConfirmModal({ amount, onConfirmClaim }: { amount: string; onConfirmClaim: () => void }) {
  const { account } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <Stack className="gap-4 p-6">
        <HStack className="items-center justify-between gap-4">
          <KyberDAOSectionTitle>
            <Trans>Claim your KNC rewards</Trans>
          </KyberDAOSectionTitle>
          <KyberDAOModalCloseButton onClick={toggleModal} />
        </HStack>
        <Stack className="gap-2 rounded-lg border-0 bg-buttonBlack p-3 text-sm text-subText outline-none">
          <span className="text-xs">
            <Trans>Your wallet address</Trans>
          </span>
          <span className="text-border">{account}</span>
        </Stack>
        <KyberDAOBodyText>
          <Trans>If your wallet is eligible, you will be able to claim your reward below:</Trans>
        </KyberDAOBodyText>
        <HStack className="items-center gap-2">
          <KNCLogo size={28} /> <KyberDAOValue className="text-2xl">{amount} KNC</KyberDAOValue>
        </HStack>
        <ButtonPrimary onClick={onConfirmClaim}>Claim</ButtonPrimary>
      </Stack>
    </Modal>
  )
}
