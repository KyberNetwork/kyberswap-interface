import { Trans } from '@lingui/macro'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'

type Props = {
  isOpen: boolean
  onDismiss?: () => void
  onConfirm?: () => void
  onViewTerms?: () => void
}

const JoinCampaignModal = ({ isOpen, onDismiss, onConfirm, onViewTerms }: Props) => {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={400}>
      <div className="w-full self-start p-5 text-sm leading-6 text-text">
        <div className="mb-2 text-base font-medium">
          <Trans>
            By joining this campaign, you agree to the campaign&apos;s{' '}
            <button
              type="button"
              onClick={onViewTerms}
              className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] text-primary underline underline-offset-2 transition-[opacity,filter] duration-200 ease-linear hover:opacity-85 hover:brightness-110"
            >
              Terms &amp; Conditions
            </button>
            .
          </Trans>
        </div>
        <div className="mt-6 flex gap-3">
          <ButtonOutlined flex={1} height="36px" onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary flex={1} height="36px" onClick={onConfirm}>
            <Trans>Agree &amp; Join</Trans>
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}

export default JoinCampaignModal
