import React, { useState } from 'react'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import { ChainId } from '@dynamic-amm/sdk'
import RainMakerBannel from 'assets/images/rain-maker.png'
import RainMakerMobileBanner from 'assets/images/rain-maker-mobile.png'
import { FAIRLAUNCH_ADDRESSES, AMP_HINT } from 'constants/index'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import InfoHelper from 'components/InfoHelper'
import { useActiveWeb3React } from 'hooks'
import { useFarmsData } from 'state/farms/hooks'
import { ExternalLink } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import {
  AdContainer,
  HeadingLeft,
  LearnMoreContainer,
  LearnMoreInstruction,
  LearnMoreLinkContainer,
  HarvestAllContainer,
  TotalRewardsContainer,
  TotalRewardsTitleWrapper,
  TotalRewardsTitle,
  TotalRewardUSD,
  TableHeader,
  ClickableText,
  StakedOnlyToggleWrapper,
  StakedOnlyToggle,
  StakedOnlyToggleText,
  HeadingContainer,
  HeadingRight,
  UpcomingFarmsContainer
} from './styleds'
import ConfirmHarvestingModal from './ConfirmHarvestingModal'
import { Flex, Text } from 'rebass'
import TotalRewardsDetail from './TotalRewardsDetail'
import LocalLoader from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'

const YieldPools = ({
  loading,
  setActiveTab,
  active
}: {
  loading: boolean
  setActiveTab: (tab: number) => void
  active?: boolean
}) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const lgBreakpoint = useMedia('(min-width: 992px)')
  const above1000 = useMedia('(min-width: 1000px)')
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)
  const [stakedOnly, setStakedOnly] = useState(false)

  const blockNumber = useBlockNumber()

  const noFarms = FAIRLAUNCH_ADDRESSES[chainId as ChainId].every(fairlaunch => {
    return !farmsByFairLaunch[fairlaunch]?.filter(
      farm => blockNumber && (active ? farm.endBlock >= blockNumber : farm.endBlock < blockNumber)
    ).length
  })

  const farms = FAIRLAUNCH_ADDRESSES[chainId as ChainId].filter(fairLaunchAddress => {
    return !!farmsByFairLaunch[fairLaunchAddress]?.filter(
      farm => blockNumber && (active ? farm.endBlock >= blockNumber : farm.endBlock < blockNumber)
    ).length
  })

  return (
    <>
      <ConfirmHarvestingModal />
      <AdContainer>
        <img src={lgBreakpoint ? RainMakerBannel : RainMakerMobileBanner} alt="RainMaker" width="100%" />
      </AdContainer>
      {active && (
        <HeadingContainer>
          <HeadingLeft>
            <LearnMoreContainer>
              <LearnMoreInstruction>
                <Trans>Stake your DMM Liquidity Provider tokens to earn token rewards.</Trans>
              </LearnMoreInstruction>
              <LearnMoreLinkContainer>
                <ExternalLink href="https://docs.dmm.exchange/rainmaker/FAQs">
                  <Trans>Learn More →</Trans>
                </ExternalLink>
              </LearnMoreLinkContainer>
            </LearnMoreContainer>
            <UpcomingFarmsContainer>
              <LearnMoreInstruction>
                <Trans>Start preparing liquidity for our upcoming farms!</Trans>
              </LearnMoreInstruction>
              <LearnMoreLinkContainer>
                <Text color={theme.primary} onClick={() => setActiveTab(2)} role="button" sx={{ cursor: 'pointer' }}>
                  <Trans>View Upcoming Farms →</Trans>
                </Text>
              </LearnMoreLinkContainer>
            </UpcomingFarmsContainer>
          </HeadingLeft>
          <HeadingRight>
            <HarvestAllContainer>
              <TotalRewardsContainer>
                <TotalRewardsTitleWrapper>
                  <TotalRewardsTitle>
                    <Trans>My Total Rewards</Trans>
                  </TotalRewardsTitle>
                  <InfoHelper
                    text={t`Total rewards that can be harvested. Harvested rewards are locked and vested over a short period (duration depends on the pool).`}
                  />
                </TotalRewardsTitleWrapper>

                <Flex>
                  <TotalRewardUSD>
                    {totalRewardsUSD ? formattedNum(totalRewardsUSD.toString(), true) : '$0'}
                  </TotalRewardUSD>
                  {totalRewardsUSD > 0 && totalRewards.length > 0 && <TotalRewardsDetail totalRewards={totalRewards} />}
                </Flex>
              </TotalRewardsContainer>
            </HarvestAllContainer>
          </HeadingRight>
        </HeadingContainer>
      )}

      <StakedOnlyToggleWrapper>
        <StakedOnlyToggle
          className="staked-only-switch"
          checked={stakedOnly}
          onClick={() => setStakedOnly(!stakedOnly)}
        />
        <StakedOnlyToggleText>
          <Trans>Staked Only</Trans>
        </StakedOnlyToggleText>
      </StakedOnlyToggleWrapper>

      {above1000 && (
        <TableHeader>
          <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pools | AMP</Trans>
            </ClickableText>
            <InfoHelper text={AMP_HINT} />
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>APR</Trans>
            </ClickableText>
            <InfoHelper
              text={
                active
                  ? t`Total estimated return based on yearly fees and bonus rewards of the pool`
                  : t`Once a farm has ended, you will continue to receive returns through LP Fees`
              }
            />
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>
        </TableHeader>
      )}

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
        >
          <Text color={theme.subText}>
            <Trans>Currently there are no Farms.</Trans>
          </Text>
        </Flex>
      ) : (
        farms.map(fairLaunchAddress => {
          return (
            <FairLaunchPools
              key={fairLaunchAddress}
              fairLaunchAddress={fairLaunchAddress}
              farms={farmsByFairLaunch[fairLaunchAddress].filter(
                farm => blockNumber && (active ? farm.endBlock >= blockNumber : farm.endBlock < blockNumber)
              )}
              stakedOnly={stakedOnly}
            />
          )
        })
      )}
    </>
  )
}

export default YieldPools
