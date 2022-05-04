import React, { useState, useCallback } from 'react'
import { Trans } from '@lingui/macro'

import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useFarmHistoryModalToggle } from 'state/application/hooks'
import Loader from 'components/Loader'
import {
  TopBar,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  UpcomingPoolsWrapper,
  NewText,
  Divider,
  FarmTypeWrapper,
  FarmType,
  PageWrapper,
  ProMMFarmGuide,
  ProMMFarmGuideAndRewardWrapper,
  ProMMTotalRewards,
} from 'components/YieldPools/styleds'
import Vesting from 'components/Vesting'
import FarmHistoryModal from 'components/FarmHistoryModal'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import YieldPools from 'components/YieldPools'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { Text, Flex } from 'rebass'
import UpcomingFarms from 'components/UpcomingFarms'
import History from 'components/Icons/History'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import Elastic from 'components/Icons/Elastic'
import Classic from 'components/Icons/Classic'
import { stringify } from 'qs'
import { ExternalLink } from 'theme'
import { ButtonPrimary } from 'components/Button'
import ProMMFarms from 'components/YieldPools/ProMMFarms'
import ProMMVesting from 'components/Vesting/ProMMVesting'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import HoverDropdown from 'components/HoverDropdown'
import { formattedNum } from 'utils'
import CurrencyLogo from 'components/CurrencyLogo'
import { fixedFormatting } from 'utils/formatBalance'
import { CurrencyAmount, Token } from '@vutien/sdk-core'

const Farms = () => {
  const { loading, data: farms } = useFarmsData()
  const qs = useParsedQueryString()
  const tab = qs.tab || 'active'
  const farmType = qs.farmType || 'promm'
  const history = useHistory()

  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  // I'm using this pattern to update data from child component to parent because I dont wanna calculate too many things in this component
  const [prommRewards, setPrommRewards] = useState<{
    [fairLaunchAddress: string]: { totalUsdValue: number; amounts: CurrencyAmount<Token>[] }
  }>({})

  const onUpdateUserReward = useCallback(
    () => (address: string, totalUsdValue: number, amounts: CurrencyAmount<Token>[]) => {
      setPrommRewards(prev => {
        prev[address] = { totalUsdValue, amounts }
        return prev
      })
    },
    [],
  )

  const prommRewardUsd = Object.values(prommRewards).reduce((acc, cur) => acc + cur.totalUsdValue, 0)
  const prommRewardAmountByAddress: { [address: string]: CurrencyAmount<Token> } = {}
  Object.values(prommRewards).forEach(item => {
    item.amounts.forEach(amount => {
      const address = amount.currency.isNative ? amount.currency.symbol : amount.currency.address
      if (!address) return
      if (!prommRewardAmountByAddress[address]) prommRewardAmountByAddress[address] = amount
      else prommRewardAmountByAddress[address] = prommRewardAmountByAddress[address].add(amount)
    })
  })

  const renderTabContent = () => {
    switch (tab) {
      case 'active':
        return farmType === 'promm' ? (
          <ProMMFarms active onUpdateUserReward={onUpdateUserReward} />
        ) : (
          <YieldPools loading={loading} active />
        )
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return <YieldPools loading={loading} active={false} />
      case 'vesting':
        // TODO: merge 2 vesting pages
        return farmType === 'promm' ? <ProMMVesting /> : <Vesting loading={vestingLoading} />
      default:
        return <YieldPools loading={loading} active />
    }
  }
  const { mixpanelHandler } = useMixpanel()
  const theme = useTheme()

  // Total rewards for Classic pool
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  return (
    <>
      <PageWrapper gap="24px">
        <TopBar>
          <FarmTypeWrapper>
            <FarmType
              active={farmType === 'promm'}
              to={{
                search: stringify({ ...qs, farmType: 'promm' }),
              }}
            >
              <Trans>Elastic Farms</Trans>
              <Elastic />
            </FarmType>

            <Text color={theme.subText}>|</Text>

            <FarmType
              active={farmType === 'dmm'}
              to={{
                search: stringify({ ...qs, farmType: 'dmm' }),
              }}
            >
              <Trans>Classic Farms</Trans>
              <Classic size={18} />
            </FarmType>
          </FarmTypeWrapper>

          <RewardTokenPrices style={{ display: 'flex', width: '100%', overflow: 'hidden', flex: 1 }} />
        </TopBar>

        <ProMMFarmGuideAndRewardWrapper>
          <ProMMFarmGuide>
            {farmType === 'promm' ? (
              <>
                <Trans>Deposit your liquidity & then stake it to earn even more attractive rewards</Trans>.{' '}
                <ExternalLink href="">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              </>
            ) : (
              <>
                <Trans>Deposit your liquidity to earn even more attractive rewards</Trans>.{' '}
                <ExternalLink href="">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              </>
            )}
          </ProMMFarmGuide>

          <ProMMTotalRewards>
            <Trans>My Total Rewards:</Trans>
            {farmType === 'promm' ? (
              <HoverDropdown
                dropdownContent={
                  !Object.values(prommRewardAmountByAddress).filter(rw => rw?.greaterThan(0)).length
                    ? ''
                    : Object.values(prommRewardAmountByAddress).map(reward => {
                        return (
                          <Flex alignItems="center" key={reward.currency.address} paddingY="4px">
                            <CurrencyLogo currency={reward.currency} size="16px" />

                            <Text fontSize="12px" marginLeft="4px">
                              {reward.toSignificant(8)} {reward.currency.symbol}
                            </Text>
                          </Flex>
                        )
                      })
                }
                content={formattedNum(`${prommRewardUsd || 0}`)}
              />
            ) : (
              <HoverDropdown
                dropdownContent={
                  !totalRewards.filter(rw => rw?.amount?.gte(0)).length
                    ? ''
                    : totalRewards.map(reward => {
                        if (!reward || !reward.amount || reward.amount.lte(0)) {
                          return null
                        }

                        return (
                          <Flex alignItems="center" key={reward.token.address} paddingY="4px">
                            <CurrencyLogo currency={reward.token} size="16px" />

                            <Text fontSize="12px" marginLeft="4px">
                              {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                            </Text>
                          </Flex>
                        )
                      })
                }
                content={formattedNum(`${totalRewardsUSD || 0}`)}
              />
            )}
          </ProMMTotalRewards>
        </ProMMFarmGuideAndRewardWrapper>

        <div>
          <TabContainer>
            <TabWrapper>
              <Tab
                onClick={() => {
                  if (tab && tab !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'active' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={!tab || tab === 'active'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Active</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>
              <Tab
                onClick={() => {
                  if (tab !== 'ended') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ENDING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'ended' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'ended'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Ended</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  if (tab !== 'coming') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'coming' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'coming'}
              >
                <UpcomingPoolsWrapper>
                  <Trans>Upcoming</Trans>
                  {UPCOMING_POOLS.length > 0 && (
                    <NewText>
                      <Trans>New</Trans>
                    </NewText>
                  )}
                </UpcomingPoolsWrapper>
              </Tab>

              <Divider />

              <Tab
                onClick={() => {
                  if (tab !== 'vesting') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                  }
                  const newQs = { ...qs, tab: 'vesting' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={tab === 'vesting'}
              >
                <PoolTitleContainer>
                  <Text>
                    <Trans>My Vesting</Trans>
                  </Text>
                  {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
                </PoolTitleContainer>
              </Tab>
            </TabWrapper>

            <ButtonPrimary
              width="max-content"
              onClick={toggleFarmHistoryModal}
              padding="10px 12px"
              style={{ gap: '4px', fontSize: '14px' }}
            >
              <History />
              <Trans>History</Trans>
            </ButtonPrimary>
          </TabContainer>

          {renderTabContent()}
        </div>
      </PageWrapper>
      <FarmHistoryModal farms={Object.values(farms).flat()} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
