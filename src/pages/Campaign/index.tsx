import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { Button, HideMedium, MediumOnly } from 'theme'
import { BarChart, ChevronDown, Clock, Share2, Star, Users } from 'react-feather'
import { ButtonEmpty, ButtonLight } from 'components/Button'
import { formatNumberWithPrecisionRange } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { useSelectCampaignModalToggle, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import Divider from 'components/Divider'
import LeaderboardLayout from 'pages/Campaign/LeaderboardLayout'
import ModalSelectCampaign from './ModalSelectCampaign'
import CampaignListAndSearch from 'pages/Campaign/CampaignListAndSearch'
import { ApplicationModal } from 'state/application/actions'
import ShareModal from 'components/ShareModal'
import { CampaignData } from 'state/campaigns/actions'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useHistory } from 'react-router-dom'
import { stringify } from 'qs'
import { isMobile } from 'react-device-detect'

export default function Campaign() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const [activeTab, setActiveTab] = useState<'how_to_win' | 'rewards' | 'leaderboard' | 'lucky_winners'>('how_to_win')

  const toggleWalletModal = useWalletModalToggle()
  const toggleShareModal = useToggleModal(ApplicationModal.SHARE)

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const rules = selectedCampaign?.rules ?? ''
  const termsAndConditions = selectedCampaign?.termsAndConditions ?? ''
  const otherDetails = selectedCampaign?.otherDetails ?? ''
  const rewardDetails = selectedCampaign?.rewardDetails ?? ''

  const [showRules, setShowRules] = useState(false)
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false)
  const [showOtherDetails, setShowOtherDetails] = useState(false)

  const { mixpanelHandler } = useMixpanel()

  const TabHowToWinContent = () => (
    <Flex flexDirection="column">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowRules(prev => !prev)}
        padding="0 0 20px 0"
      >
        <Text fontSize={16} fontWeight={500}>
          <Trans>Rules</Trans>
        </Text>
        <ButtonEmpty width="fit-content" style={{ padding: '0' }}>
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showRules && <HTMLWrapper dangerouslySetInnerHTML={{ __html: rules }} />}
      <Divider />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowTermsAndConditions(prev => !prev)}
        padding="20px 0"
      >
        <Text fontSize={16} fontWeight={500}>
          <Trans>Terms and Conditions</Trans>
        </Text>
        <ButtonEmpty width="fit-content" style={{ padding: '0' }}>
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showTermsAndConditions && <HTMLWrapper dangerouslySetInnerHTML={{ __html: termsAndConditions }} />}
      <Divider />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowOtherDetails(prev => !prev)}
        padding="20px 0"
      >
        <Text fontSize={16} fontWeight={500}>
          <Trans>Other Details</Trans>
        </Text>
        <ButtonEmpty width="fit-content" style={{ padding: '0' }}>
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showOtherDetails && <HTMLWrapper dangerouslySetInnerHTML={{ __html: otherDetails }} />}
      <Divider />
    </Flex>
  )

  const TabRewardsContent = () => (
    <Flex flexDirection="column" style={{ gap: '20px' }}>
      <Text fontSize={16} fontWeight={500}>
        <Trans>Rewards</Trans>
      </Text>
      <HTMLWrapper dangerouslySetInnerHTML={{ __html: rewardDetails }} />
    </Flex>
  )

  const toggleSelectCampaignModal = useSelectCampaignModalToggle()

  const history = useHistory()
  const onSelectCampaign = (campaign: CampaignData) => {
    history.replace({
      search: stringify({ selectedCampaignId: campaign.id }),
    })
  }

  const now = Date.now()

  return (
    <PageWrapper>
      <CampaignContainer>
        <HideMedium style={{ maxWidth: '400px' }}>
          <CampaignListAndSearch onSelectCampaign={onSelectCampaign} />
        </HideMedium>

        <CampaignDetail>
          <MediumOnly>
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="20px" lineHeight="24px" fontWeight={500}>
                <Trans>Campaigns</Trans>
              </Text>
              <ButtonEmpty
                style={{ padding: '9px 9px', background: theme.background, width: 'fit-content' }}
                onClick={toggleSelectCampaignModal}
              >
                <BarChart
                  size={16}
                  strokeWidth={3}
                  color={theme.subText}
                  style={{ transform: 'rotate(90deg) scaleX(-1)' }}
                />
              </ButtonEmpty>
              <ModalSelectCampaign />
            </Flex>
          </MediumOnly>

          <CampaignDetailImage
            src={isMobile ? selectedCampaign?.mobileBanner : selectedCampaign?.desktopBanner}
            alt="campaign-image"
          />
          <CampaignDetailHeader>
            <Text fontSize="20px" fontWeight={500}>
              {selectedCampaign?.name}
            </Text>
            <EnterNowAndShareContainer>
              <Button
                style={{
                  padding: '12px 58px',
                  minWidth: 'fit-content',
                  height: 'fit-content',
                  lineHeight: '20px',
                  fontWeight: 500,
                  color: theme.darkText,
                }}
                onClick={() => {
                  if (selectedCampaign) {
                    mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_ENTER_NOW_CLICKED)
                    window.open(selectedCampaign.enterNowUrl, '_blank')
                  }
                }}
              >
                <Trans>Enter now</Trans>
              </Button>
              <ButtonLight borderRadius="50%" style={{ padding: '8px 11px' }} onClick={toggleShareModal}>
                <Share2 size={20} color={theme.primary} style={{ minWidth: '20px', minHeight: '20px' }} />
              </ButtonLight>
              <ShareModal
                url={window.location.href}
                onShared={() => mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_SHARE_TRADING_CONTEST_CLICKED)}
              />
            </EnterNowAndShareContainer>
          </CampaignDetailHeader>
          <CampaignDetailBoxGroup>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>
                  {selectedCampaign?.status === 'Upcoming'
                    ? 'Starting In'
                    : selectedCampaign?.status === 'Ongoing'
                    ? 'Ending In'
                    : 'Ended In'}
                </Trans>
              </Text>
              <Clock size={20} color={theme.subText} />
              <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                {selectedCampaign
                  ? selectedCampaign.status === 'Upcoming'
                    ? getFormattedTimeFromSecond((selectedCampaign.startTime - now) / 1000)
                    : selectedCampaign.status === 'Ongoing'
                    ? getFormattedTimeFromSecond((selectedCampaign.endTime - now) / 1000)
                    : 'ENDED'
                  : '--'}
              </Text>
            </CampaignDetailBoxGroupItem>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>Participants</Trans>
              </Text>
              <Users size={20} color={theme.subText} />
              <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                {selectedCampaignLeaderboard?.numberOfParticipants
                  ? formatNumberWithPrecisionRange(selectedCampaignLeaderboard.numberOfParticipants, 0, 0)
                  : '--'}
              </Text>
            </CampaignDetailBoxGroupItem>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>Your Rank</Trans>
              </Text>
              <Star size={20} color={theme.subText} />
              {account ? (
                <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                  {selectedCampaignLeaderboard?.userRank || '--'}
                </Text>
              ) : (
                <ButtonLight
                  style={{ gridColumn: '1 / -1', padding: '8px', margin: '0', borderRadius: '18px' }}
                  onClick={toggleWalletModal}
                >
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              )}
            </CampaignDetailBoxGroupItem>
          </CampaignDetailBoxGroup>

          <CampaignDetailTabRow>
            <CampaignDetailTab active={activeTab === 'how_to_win'} onClick={() => setActiveTab('how_to_win')}>
              <Trans>How to win</Trans>
            </CampaignDetailTab>
            <CampaignDetailTab active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
              <Trans>Rewards</Trans>
            </CampaignDetailTab>
            <CampaignDetailTab active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
              <Trans>Leaderboard</Trans>
            </CampaignDetailTab>
            {/*<CampaignDetailTab active={activeTab === 'lucky_winners'} onClick={() => setActiveTab('lucky_winners')}>*/}
            {/*  <Trans>Lucky Winners</Trans>*/}
            {/*</CampaignDetailTab>*/}
          </CampaignDetailTabRow>

          <CampaignDetailContent>
            {activeTab === 'how_to_win' && <TabHowToWinContent />}
            {activeTab === 'rewards' && <TabRewardsContent />}
            {activeTab === 'leaderboard' && <LeaderboardLayout />}
            {activeTab === 'lucky_winners' && <LeaderboardLayout />}
          </CampaignDetailContent>
        </CampaignDetail>
      </CampaignContainer>
    </PageWrapper>
  )
}

const CampaignDetailContent = styled.div`
  padding: 28px 24px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  flex: 1;
  overflow: auto;
`

const CampaignDetailTab = styled(ButtonEmpty)<{ active: boolean }>`
  padding: 0 0 4px 0;
  color: ${({ theme }) => theme.subText};
  border-radius: 0;
  cursor: pointer;
  width: fit-content;
  min-width: fit-content;

  &:hover {
    opacity: 0.72;
  }

  ${({ theme, active }) =>
    active &&
    css`
      color: ${theme.text};
      border-bottom: 1px solid ${theme.primary};
    `}
`

const CampaignDetailTabRow = styled.div`
  display: flex;
  gap: 24px;
  overflow: auto;
`

const CampaignDetailBoxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`

const CampaignDetailBoxGroupItem = styled.div`
  flex: 1;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 16px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    &:first-of-type {
      min-width: 100%;
    } 
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    &:first-of-type {
      min-width: unset;
    } 
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    &:first-of-type {
      min-width: 100%;
    } 
  `}
`

const CampaignDetailHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
  justify-content: space-between;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    align-items: center;
    
    & > *:first-child {
      text-align: center;
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    align-items: center;
    
    & > *:first-child {
      text-align: left;
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: center;
    
    & > *:first-child {
      text-align: center;
    }
  `}
`

const EnterNowAndShareContainer = styled.div`
  gap: 12px;
  min-width: fit-content;
  display: flex;
`

const PageWrapper = styled.div`
  padding: 24px 64px;
  width: 100%;
  max-width: 1440px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  ${css`
    padding: 24px 16px;
  `}
  `}
`

const CampaignContainer = styled.div`
  display: flex;
  gap: 24px;
  //height: calc(100vh - 84.34px - 24px - 24px - 62px);
  min-height: calc(100vh - 84.34px - 24px - 24px - 62px);
  overflow: auto;
`

const CampaignDetail = styled.div`
  flex: 2;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const CampaignDetailImage = styled.img`
  height: 124px;
  object-fit: cover;
  border-radius: 8px;
`

const HTMLWrapper = styled.div`
  padding-bottom: 20px;
  * {
    margin: 0 !important;
  }
  p {
    font-size: 14px;
    line-height: 16px;
  }
`
