import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ButtonPrimary } from 'components/Button'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useRewards } from 'hooks/useRewards'
import useTheme from 'hooks/useTheme'
import { formatNumberWithPrecisionRange } from 'utils'

import CardBackground from './AccountInfo/CardBackground'
import Tab from './Transactions/Tab'
import { REWARD_TYPE } from './type'

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
`
const BalanceTitle = styled(TextDashed)`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  gap: 16px;
  overflow-y: scroll;
`

const Content = styled.div`
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;
  padding: 12px 16px;

  display: flex;
  gap: 4px;
  flex-direction: column;
  justify-content: space-between;
`
const BalanceValue = styled.span`
  font-size: 36px;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const RewardWrapper = styled.div`
  display: flex;
  border-radius: 44px;
  background-color: ${({ theme }) => theme.background};
  width: 100%;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;
`

const TABS = [
  {
    title: t`Voting Rewards`,
    value: REWARD_TYPE.VOTING_REWARDS,
  },
  {
    title: t`Gas Refund`,
    value: REWARD_TYPE.GAS_REFUND,
  },
] as { title: string; value: REWARD_TYPE }[]

export default function RewardCenter() {
  const { mixpanelHandler } = useMixpanel()
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<REWARD_TYPE>(REWARD_TYPE.VOTING_REWARDS)
  const { rewards, totalReward } = useRewards()
  const currentReward = rewards[activeTab]

  const [claiming, setClaiming] = useState(false)
  const claimRewards = useCallback(async () => {
    try {
      setClaiming(true)
      mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_CLAIM_CLICK, { source: 'wallet UI', token_amount: currentReward.knc })
      await currentReward.claim()
    } finally {
      setClaiming(false)
    }
  }, [currentReward, mixpanelHandler])

  return (
    <Wrapper>
      <ContentWrapper>
        <CardBackground noLogo />
        <Content>
          <Flex
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Flex
              sx={{
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <Flex width="fit-content" sx={{ gap: '4px' }}>
                <MouseoverTooltip
                  text={t`Total Available Rewards = Total Available Voting Rewards + Total Available Gas Refund`}
                >
                  <BalanceTitle>
                    <Trans>Total Available Rewards</Trans>
                  </BalanceTitle>
                </MouseoverTooltip>
              </Flex>

              <BalanceValue>{formatNumberWithPrecisionRange(totalReward.knc, 0, 8)} KNC</BalanceValue>
              <Text fontSize={12} fontWeight={500} lineHeight="16px" color={theme.subText}>
                {typeof totalReward.usd === 'number'
                  ? `${totalReward.usd > 0 ? '~ ' : ''}$${formatNumberWithPrecisionRange(totalReward.usd, 0, 8)}`
                  : '$ --'}
              </Text>
            </Flex>
          </Flex>
        </Content>
      </ContentWrapper>
      <Tab<REWARD_TYPE> activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      <Flex flexDirection="column" sx={{ gap: '12px' }}>
        <Text fontSize={12} fontWeight={500} lineHeight="16px" color={theme.primary}>
          <Trans>Your Reward</Trans>
        </Text>
        <Flex sx={{ gap: '8px' }}>
          <RewardWrapper>
            <DollarIcon width={12} height={12} color={theme.subText} />
            <Text fontSize={12} fontWeight={400} lineHeight="16px">
              {currentReward.knc} KNC
            </Text>
          </RewardWrapper>
          <ButtonPrimary
            width="fit-content"
            padding="4px 15px"
            minWidth="unset"
            onClick={claimRewards}
            disabled={claiming || !currentReward.knc}
          >
            <Text fontSize={14} fontWeight={500} lineHeight="20px">
              {claiming ? <Trans>Claiming</Trans> : <Trans>Claim</Trans>}
            </Text>
          </ButtonPrimary>
        </Flex>
      </Flex>
    </Wrapper>
  )
}
