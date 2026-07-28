import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import safePalWallet from 'pages/Campaign/assets/safepal_wallet.png'
import { CampaignWeek } from 'pages/Campaign/timelines'
import { isCampaignWeekActive, isCampaignWeekEnded } from 'pages/Campaign/utils/safepalUtils'

type Props = {
  isOpen: boolean
  onDismiss: () => void
  claimWeek: CampaignWeek
}

const SAFEPAL_CLAIM_URL = 'https://www.safepal.com/en/claimX1/v2/#/v/party100912/gcn3lj'

const formatClaimDeadline = (timestamp: number) =>
  dayjs(timestamp * 1000)
    .utc()
    .format('DD/MM/YYYY HH:mm') + ' UTC'

export default function SafePalClaimModal({ isOpen, onDismiss, claimWeek }: Props) {
  const deadlineText = formatClaimDeadline(claimWeek.end)
  const claimDisabled = isCampaignWeekEnded(claimWeek) || !isCampaignWeekActive(claimWeek)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false}>
      <div className="flex w-full flex-col items-center gap-4 p-6 text-sm leading-6 text-text max-sm:gap-3 max-sm:p-5">
        <span className="text-xl font-medium">
          <Trans>Rewards Claiming</Trans>
        </span>

        <span className="font-medium text-text">
          <Trans>You&apos;re eligible to claim 🎁 SafePal X1 Hardware Wallet</Trans>
        </span>

        <img src={safePalWallet} alt="safepal wallet" style={{ width: '160px', maxWidth: '100%', height: 'auto' }} />

        <span className="text-center text-subText">
          <Trans>Claim deadline: {deadlineText}</Trans>
        </span>

        <div className="mt-1 flex w-full gap-3">
          <ButtonOutlined flex={1} height="40px" onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            flex={1}
            height="40px"
            disabled={claimDisabled}
            onClick={() => {
              window.open(SAFEPAL_CLAIM_URL, '_blank', 'noopener,noreferrer')
              onDismiss()
            }}
          >
            <Trans>Claim on SafePal</Trans>
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}
