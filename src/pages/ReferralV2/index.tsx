import React, { useEffect, useState, useCallback } from 'react'
import {
  ContentWrapper,
  Referralv2Wrapper,
  HeaderWrapper,
  Container,
  CreateReferralBox,
  CopyTextWrapper,
  CopyTextInput,
  PlaceholderText,
} from './styled'
import { Trans, t } from '@lingui/macro'
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
import ShareModal from 'components/ShareModal'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import CaptchaModal from './CaptchaModal'
import CongratulationModal from './CongratulationModal'
function CopyTextBox({ placeholder, textToCopy }: { placeholder?: string; textToCopy: string }) {
  return (
    <CopyTextWrapper>
      <PlaceholderText>{placeholder}</PlaceholderText>
      <CopyTextInput disabled value={textToCopy} />
      <CopyHelper textToCopy={textToCopy} />
    </CopyTextWrapper>
  )
}
const ReferralCopyBoxes = ({ code }: { code: string | undefined }) => (
  <>
    <CopyTextBox
      placeholder={t`Referral Link`}
      textToCopy={code ? `${window.location.origin}/swap?referralCode=${code.toUpperCase()}` : ''}
    />
    <CopyTextBox placeholder={t`Referral Code`} textToCopy={code ? code.toUpperCase() : ''} />
  </>
)
export default function ReferralV2() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [showCongratulationModal, setShowCongratulationModal] = useState(true)
  const above768 = useMedia('(min-width: 768px)')
  const {
    referrerInfo,
    refereeInfo,
    leaderboardData,
    getReferrerInfo,
    getRefereeInfo,
    getReferrerLeaderboard,
    createReferrer,
    unlockRefereeReward,
    claimReward,
  } = useReferralV2()

  const handleGenerateClick = async () => {
    if (!account) return
    createReferrer()
  }

  const handleRefreshLeaderboardData = useCallback(() => {
    getReferrerLeaderboard(1)
  }, [getReferrerLeaderboard])
  const handlePageChange = useCallback(
    (page: number) => {
      getReferrerLeaderboard(page)
    },
    [getReferrerLeaderboard],
  )
  useEffect(() => {
    getReferrerLeaderboard(1)
    if (!account) return
    getReferrerInfo()
    getRefereeInfo()
  }, [account])
  const toggleShareModal = useToggleModal(ApplicationModal.SHARE)

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
                    <ButtonPrimary flex={1} onClick={toggleShareModal}>
                      <Trans>Invite your friends</Trans>
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary flex={1} onClick={handleGenerateClick}>
                      <Trans>Generate Now</Trans>
                    </ButtonPrimary>
                  )
                ) : (
                  <ButtonLight onClick={toggleWalletModal} flex={1}>
                    <Trans>Connect your Wallet</Trans>
                  </ButtonLight>
                )}
              </Flex>
              <ReferralCopyBoxes code={referrerInfo?.referralCode} />
            </CreateReferralBox>
          </Flex>
        </Container>
      </HeaderWrapper>
      <ContentWrapper>
        <Container>
          {refereeInfo && <ProgressionReward refereeInfo={refereeInfo} />}
          <div>Testing animation purpose section:</div>
          <ProgressionReward
            refereeInfo={{ ...refereeInfo, tradeVolume: 500 }}
            onUnlock={() => setShowCaptchaModal(true)}
          />
          {referrerInfo && <DashboardSection referrerInfo={referrerInfo} onClaim={claimReward} />}
          <Leaderboard
            leaderboardData={leaderboardData}
            onTimerExpired={handleRefreshLeaderboardData}
            onChangePage={handlePageChange}
          />
        </Container>
      </ContentWrapper>
      {referrerInfo && (
        <ShareModal
          content={<ReferralCopyBoxes code={referrerInfo.referralCode} />}
          url={`${window.location.origin}/swap?referralCode=${referrerInfo?.referralCode?.toUpperCase()}`}
        />
      )}
      <CaptchaModal
        isOpen={showCaptchaModal}
        onDismiss={() => setShowCaptchaModal(false)}
        onSuccess={() => {
          setTimeout(async () => {
            setShowCaptchaModal(false)
            setShowCongratulationModal(true)
          }, 2000)
        }}
      />
      <CongratulationModal isOpen={showCongratulationModal} onDismiss={() => setShowCongratulationModal(false)} />
    </Referralv2Wrapper>
  )
}
