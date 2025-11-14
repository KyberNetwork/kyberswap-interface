import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { RaffleCampaignParticipant } from 'services/campaignRaffle'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

const Wrapper = styled.div`
  padding: 24px;
  color: ${({ theme }) => theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px;
  `}
`

const ActionRow = styled(Flex)`
  width: 100%;
  gap: 12px;
`

type Props = {
  isOpen: boolean
  onDismiss: () => void
  onConfirm: () => void
  participant?: RaffleCampaignParticipant
}

export const RaffleRewardModal = ({ isOpen, onDismiss, onConfirm, participant }: Props) => {
  const theme = useTheme()

  const rewaredWeek = useMemo(() => {
    if (participant?.reward_week_1 && participant.reward_week_2) return '1 & 2'
    if (participant?.reward_week_1) return '1'
    if (participant?.reward_week_2) return '2'
    return null
  }, [participant])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={460} minHeight={false}>
      <Wrapper>
        <Text fontSize={18} fontWeight={500} textAlign="center">
          <Trans>🎉 Congratulations!</Trans>
        </Text>

        <Flex flexDirection="column" sx={{ gap: '8px', alignItems: 'center' }}>
          <Text color={theme.subText}>
            <Trans>You&apos;ve won 🎁 Week {rewaredWeek} - Raffle Campaign.</Trans>
          </Text>
          <Text>
            <Trans>🏆 Prize: {formatDisplayNumber(participant?.reward_all, { significantDigits: 6 })} KNC</Trans>
          </Text>
          <Text fontSize={14} color={theme.subText} textAlign="center">
            <Trans>
              Your rewards will be distributed directly to your wallet within 7 business days after the announcement.
            </Trans>
          </Text>
        </Flex>

        <ActionRow>
          <ButtonOutlined flex={1} height="36px" onClick={onDismiss}>
            <Trans>Close</Trans>
          </ButtonOutlined>
          <ButtonPrimary flex={1} height="36px" onClick={onConfirm}>
            <Trans>View details</Trans>
          </ButtonPrimary>
        </ActionRow>
      </Wrapper>
    </Modal>
  )
}

export default RaffleRewardModal
