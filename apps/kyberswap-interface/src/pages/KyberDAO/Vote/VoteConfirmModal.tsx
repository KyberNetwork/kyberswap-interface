import { Trans } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { KyberDAOBodyText, KyberDAOModalCloseButton, KyberDAOSectionTitle } from 'pages/KyberDAO/common'

export default function VoteConfirmModal({
  isShow,
  toggle,
  options,
  title,
  onVoteConfirm,
}: {
  isShow: boolean
  toggle: () => void
  options: string
  title: string
  onVoteConfirm: () => void
}) {
  return (
    <Modal isOpen={isShow} onDismiss={toggle}>
      <Stack className="gap-4 p-5">
        <HStack className="items-center justify-between gap-4">
          <KyberDAOSectionTitle>
            <Trans>Vote</Trans>
          </KyberDAOSectionTitle>
          <KyberDAOModalCloseButton onClick={toggle} />
        </HStack>
        <KyberDAOBodyText className="text-subText [&_b]:font-medium [&_b]:text-text">
          <Trans>
            You are voting for <b>{options}</b> on <b>{title}</b> with your KIP voting power
          </Trans>
        </KyberDAOBodyText>
        <ButtonPrimary onClick={onVoteConfirm}>Vote</ButtonPrimary>
      </Stack>
    </Modal>
  )
}
