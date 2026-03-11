import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import safePalWallet from 'pages/Campaign/assets/safepal_wallet.png'
import { CampaignWeek } from 'pages/Campaign/timelines'
import { isCampaignWeekActive, isCampaignWeekEnded } from 'pages/Campaign/utils/safepalUtils'

const Wrapper = styled.div`
  width: 100%;
  padding: 24px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  line-height: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px;
    gap: 12px;
  `}
`

const ActionRow = styled(Flex)`
  width: 100%;
  gap: 12px;
`

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
  const theme = useTheme()
  const deadlineText = formatClaimDeadline(claimWeek.end)
  const claimDisabled = isCampaignWeekEnded(claimWeek) || !isCampaignWeekActive(claimWeek)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false}>
      <Wrapper>
        <Text fontSize={20} fontWeight={500}>
          <Trans>Rewards Claiming</Trans>
        </Text>

        <Text fontWeight={500} color={theme.text}>
          <Trans>You&apos;re eligible to claim 🎁 SafePal X1 Hardware Wallet</Trans>
        </Text>

        <img src={safePalWallet} alt="safepal wallet" style={{ width: '160px', maxWidth: '100%', height: 'auto' }} />

        <Text color={theme.subText} textAlign="center">
          <Trans>Claim deadline: {deadlineText}</Trans>
        </Text>

        <ActionRow marginTop="4px">
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
        </ActionRow>
      </Wrapper>
    </Modal>
  )
}
