import { Trans } from '@lingui/macro'
import { X } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

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
  const theme = useTheme()
  return (
    <Modal isOpen={isShow} onDismiss={toggle}>
      <div className="flex flex-col gap-5 p-5">
        <RowBetween>
          <AutoRow gap="2px">
            <span className="text-xl">
              <Trans>Vote</Trans>
            </span>
          </AutoRow>
          <div role="button" onClick={toggle} className="flex cursor-pointer">
            <X onClick={toggle} size={20} color={theme.subText} />
          </div>
        </RowBetween>
        <span className="text-base leading-6 text-subText [&_b]:font-medium [&_b]:text-text">
          <Trans>
            You are voting for <b>{options}</b> on <b>{title}</b> with your KIP voting power
          </Trans>
        </span>
        <ButtonPrimary onClick={onVoteConfirm}>Vote</ButtonPrimary>
      </div>
    </Modal>
  )
}
