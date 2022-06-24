import React, { useState } from 'react'
import {
  ContentWrapper,
  Referralv2Wrapper,
  HeaderWrapper,
  Container,
  CreateReferralBox,
  CopyTextWrapper,
  CopyTextInput,
} from './styled'
import { Trans } from '@lingui/macro'
import { Flex, Box, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { useWalletModalToggle } from 'state/application/hooks'
import CopyHelper from './CopyHelper'
import ProgressionReward from './ProgressionReward'
import DashboardSection from './DashboardSection'
import Leaderboard from './Leaderboard'
import { useActiveWeb3React } from 'hooks'
import { useMedia } from 'react-use'
import useReferralV2 from 'hooks/useReferralV2'
import ShareLinkModal from 'pages/CreateReferral/ShareLinkModal'

function CopyTextBox({ placeholder, textToCopy }: { placeholder?: string; textToCopy: string }) {
  return (
    <CopyTextWrapper>
      <CopyTextInput disabled placeholder={placeholder} />
      <CopyHelper textToCopy={textToCopy} />
    </CopyTextWrapper>
  )
}

export default function ReferralV2() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const above768 = useMedia('(min-width: 768px)')
  const { referrerInfo, createReferrer } = useReferralV2()
  const [showShareModal, setShowShareModal] = useState(false)
  const handleGenerateClick = async () => {
    if (!account) return
    const data = await createReferrer()
  }
  return (
    <Referralv2Wrapper>
      <HeaderWrapper>
        <Container>
          <Flex flexDirection={above768 ? 'row' : 'column'} alignItems="center">
            <Box flex={1}>
              <Text fontSize={'48px'} lineHeight={'60px'} maxWidth={'392px'}>
                <Trans>
                  Refer Friends
                  <br />& Earn <span style={{ color: theme.primary }}>KNC</span>
                </Trans>
              </Text>
              <Text paddingTop={'28px'} fontSize={'16px'} lineHeight={'24px'} maxWidth={'392px'} color={theme.subText}>
                <Trans>
                  Earn KNC for every new user you refer! Both Referrers and Referees can earn KNC rewards. The more you
                  refer, the more you earn! Read the rules <a>here</a>
                </Trans>
              </Text>
            </Box>
            <CreateReferralBox>
              <Flex alignItems="center">
                <Text flex={1} fontWeight={500} fontSize={20} color={theme.text} textAlign="left">
                  <Trans>Your Referral</Trans>
                </Text>

                {account ? (
                  referrerInfo ? (
                    <ButtonPrimary flex={1}>
                      <Trans>Invite your friends</Trans>
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary flex={1} onClick={() => setShowShareModal(true)}>
                      <Trans>Generate Now</Trans>
                    </ButtonPrimary>
                  )
                ) : (
                  <ButtonLight onClick={toggleWalletModal} flex={1}>
                    <Trans>Connect your Wallet</Trans>
                  </ButtonLight>
                )}
              </Flex>
              <CopyTextBox placeholder="Referral Link" textToCopy="Referral Link" />
              <CopyTextBox placeholder="Referral Code" textToCopy="Referral Code" />
            </CreateReferralBox>
          </Flex>
        </Container>
      </HeaderWrapper>
      <ContentWrapper>
        <Container>
          <ProgressionReward />
          <DashboardSection />
          <Leaderboard />
        </Container>
      </ContentWrapper>
      <ShareLinkModal isOpen={showShareModal} onDismiss={() => setShowShareModal(false)} shareUrl="12312124" />
    </Referralv2Wrapper>
  )
}
