import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { TokenLogoWithChain } from 'components/Logo'
import { NewLabel } from 'components/Menu'
import MenuFlyout from 'components/MenuFlyout'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import ClaimButton from './components/ClaimButton'
import NearIntentDashboard from './components/MyDashboard/NearIntentDashboard'
import RaffleDashboard from './components/MyDashboard/RaffleDashboard'
import SafePalDashboard from './components/MyDashboard/SafePalDashboard'
import { CampaignType, campaignConfig } from './constants'
import { useNearIntentCampaignReward } from './hooks/useNearIntentCampaignReward'
import { Tab, Tabs, Wrapper } from './styles'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.25fr 100px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 1rem 0;
  gap: 1rem;
  font-weight: 500;
`

const TableRow = styled(TableHeader)`
  font-size: 1rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  align-items: center;
`

const DropdownList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const DropdownAnchor = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`

const DropdownItem = styled.button<{ $active: boolean }>`
  width: 100%;
  border: 0;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};

  :hover {
    background: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};
  }
`

export function getDateOfWeek(w: number, y: number) {
  const first = y === 2025 ? -1 : 1 // 1st of January
  const d = first + (w - 1) * 7 // 1st of January + 7 days for each week
  return new Date(y, 0, d)
}

const NEW_CAMPAIGN = CampaignType.SafePal
const DASHBOARD_TABS: CampaignType[] = [
  CampaignType.SafePal,
  CampaignType.Raffle,
  CampaignType.NearIntents,
  CampaignType.MayTrading,
]

const MyDashboard = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTab = searchParams.get('tab') as CampaignType | null
  const tab = searchTab && DASHBOARD_TABS.includes(searchTab) ? searchTab : NEW_CAMPAIGN

  const changeTab = (tab: CampaignType) => {
    searchParams.set('tab', tab)
    setSearchParams(searchParams)
  }

  const { reward, baseWeek, banner } = campaignConfig[tab]

  const campaignLabelMap: Record<CampaignType, string> = {
    [CampaignType.SafePal]: t`SafePal`,
    [CampaignType.Raffle]: t`Weekly Rewards`,
    [CampaignType.NearIntents]: t`Cross Chain`,
    [CampaignType.MayTrading]: t`May Trading`,
    [CampaignType.Aggregator]: t`Trading`,
    [CampaignType.LimitOrder]: t`Limit Order`,
    [CampaignType.Referrals]: t`Referral`,
  }

  const mockToken = new Token(1, ZERO_ADDRESS, 18, 'mock')

  const mayTradingReward = campaignConfig[CampaignType.MayTrading].reward

  const rewardTokenLogo = reward.logo
  const rewardTokenSymbol = reward.symbol

  const mayTradingRewardPrice =
    useTokenPrices([mayTradingReward.address], mayTradingReward.chainId)?.[mayTradingReward.address] || 0

  const { data: mayTrading } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    { skip: !account },
  )

  const nearIntentCampaingReward = useNearIntentCampaignReward()
  const totalNearCampaignReward = Object.values(nearIntentCampaingReward).reduce(
    (acc, cur) => acc + BigInt(cur?.totalReward || 0),
    0n,
  )
  const nearCampaignReward = campaignConfig[CampaignType.NearIntents].reward
  const nearIntentReward = CurrencyAmount.fromRawAmount(
    new Token(nearCampaignReward.chainId, nearCampaignReward.address, nearCampaignReward.decimals, 'mock'),
    totalNearCampaignReward.toString(),
  )

  const data = tab === CampaignType.MayTrading ? mayTrading : undefined

  const mayTradingRw = CurrencyAmount.fromRawAmount(mockToken, mayTrading?.data?.totalReward?.split('.')[0] || '0')

  const totalMayTradingRw = formatDisplayNumber(+mayTradingRw.toExact(), { significantDigits: 6 })
  const totalMayTradingRwUsd = formatDisplayNumber(+mayTradingRw.toExact() * mayTradingRewardPrice, {
    significantDigits: 6,
    style: 'currency',
  })

  const mayTradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    account ? mayTrading?.data?.totalClaimableReward?.split('.')[0] || '0' : '0',
  )

  const totalMayTradingClaimableRw = formatDisplayNumber(+mayTradingClaimableRw.toExact(), { significantDigits: 6 })
  const toalMayTradingClaimableRwUsd = formatDisplayNumber(+mayTradingClaimableRw.toExact() * mayTradingRewardPrice, {
    significantDigits: 6,
    style: 'currency',
  })

  const totalRewardByCampaign = CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0')
  const claimableRewardByCampaign = CurrencyAmount.fromRawAmount(
    mockToken,
    data?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const price = mayTradingRewardPrice
  const [isOpenMenu, setIsOpenMenu] = useState(false)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const endedCampaigns = [
    {
      type: CampaignType.Raffle,
      label: campaignLabelMap[CampaignType.Raffle],
    },
    {
      type: CampaignType.NearIntents,
      label: campaignLabelMap[CampaignType.NearIntents],
    },
    {
      type: CampaignType.MayTrading,
      label: campaignLabelMap[CampaignType.MayTrading],
    },
  ]
  const selectedEndedCampaign = endedCampaigns.find(item => item.type === tab)

  const infor = (
    <InfoHelper
      text={
        <Trans>
          The Estimated Rewards will vary based on the points earned by you and all campaign participants during the
          week. Check out how they are calculated in the{' '}
          <Text as="span" fontWeight="500" color={theme.primary}>
            Information
          </Text>{' '}
          tab.
        </Trans>
      }
    />
  )

  return (
    <Wrapper>
      <img src={banner} width="100%" alt="banner" style={{ borderRadius: '12px' }} />
      <Flex marginTop="1.5rem" mb="1.5rem" sx={{ gap: '10px' }}>
        <Text fontSize={24} fontWeight="500">
          <Trans>My Dashboard</Trans>
        </Text>
      </Flex>

      <Flex sx={{ gap: '1rem', marginY: '24px' }} flexDirection={upToSmall ? 'column' : 'row'}>
        <Box
          sx={{
            padding: '20px 30px',
            borderRadius: '20px',
            backgroundImage: 'linear-gradient(121deg, #7177e3bf, #2C3178 104.95%)',
            flex: 1,
          }}
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Text>
              <Trans>My Est. Rewards</Trans> {infor}
            </Text>
          </Flex>
          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <TokenLogoWithChain chainId={mayTradingReward.chainId} tokenLogo={mayTradingReward.logo} size={24} />
            <Text fontWeight="500" ml="6px">
              {totalMayTradingRw} {mayTradingReward.symbol}
            </Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {totalMayTradingRwUsd}
            </Text>
          </Flex>
          {totalNearCampaignReward > 0n && (
            <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
              <TokenLogoWithChain chainId={nearCampaignReward.chainId} tokenLogo={nearCampaignReward.logo} size={24} />
              <Text fontWeight="500" ml="6px">
                {nearIntentReward.toSignificant(4)} {nearCampaignReward.symbol}
              </Text>
              <Text color="#FAFAFA80" fontSize={16} marginTop="2px"></Text>
            </Flex>
          )}
          <Text fontStyle="italic" color={theme.subText} mt="12px">
            <Trans>The current rewards are based on your current rank. See Information for details.</Trans>
          </Text>
        </Box>

        <Box
          sx={{
            padding: '20px 30px',
            borderRadius: '20px',
            backgroundImage: 'linear-gradient(309.26deg, #0E3C34 -11.46%, #28CD95 207.8%)',
            flex: 1,
          }}
        >
          <Text>
            <Trans>My claim-able rewards</Trans>
          </Text>

          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <TokenLogoWithChain chainId={mayTradingReward.chainId} tokenLogo={mayTradingReward.logo} size={24} />
            <Text fontWeight="500" ml="6px">
              {totalMayTradingClaimableRw} {mayTradingReward.symbol}
            </Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {toalMayTradingClaimableRwUsd}
            </Text>
          </Flex>

          <Text fontStyle="italic" color={theme.subText} mt="12px">
            <Trans>Total final rewards that you can claim for the campaign.</Trans>
          </Text>
        </Box>
      </Flex>

      <Tabs>
        <Tab role="button" active={tab === NEW_CAMPAIGN} onClick={() => changeTab(NEW_CAMPAIGN)}>
          <Flex>
            {campaignLabelMap[NEW_CAMPAIGN]}{' '}
            <NewLabel isNew>
              <Trans>New</Trans>
            </NewLabel>
          </Flex>
        </Tab>
        {selectedEndedCampaign && (
          <Tab
            key={selectedEndedCampaign.type}
            role="button"
            active={true}
            onClick={() => changeTab(selectedEndedCampaign.type)}
          >
            <Flex>
              {selectedEndedCampaign.label}
              <Text as="span" fontSize={10} ml="4px">
                <Trans>Ended</Trans>
              </Text>
            </Flex>
          </Tab>
        )}
        {endedCampaigns.length > 0 && (
          <Flex justifyContent="flex-end" flex={1}>
            <DropdownAnchor>
              <MenuFlyout
                isOpen={isOpenMenu}
                toggle={() => setIsOpenMenu(prev => !prev)}
                modalWhenMobile={false}
                hasArrow={false}
                customStyle={{
                  minWidth: '240px',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  padding: '8px',
                  borderRadius: '16px',
                  backgroundColor: theme.background,
                }}
                trigger={
                  <ButtonIcon color={tab !== NEW_CAMPAIGN ? theme.primary : undefined}>
                    <MoreHorizontal size={16} />
                  </ButtonIcon>
                }
              >
                <DropdownList>
                  {endedCampaigns.map(campaign => (
                    <DropdownItem
                      key={campaign.type}
                      $active={tab === campaign.type}
                      onClick={() => {
                        changeTab(campaign.type)
                        setIsOpenMenu(false)
                      }}
                    >
                      <Text color="inherit">{campaign.label}</Text>
                    </DropdownItem>
                  ))}
                </DropdownList>
              </MenuFlyout>
            </DropdownAnchor>
          </Flex>
        )}
      </Tabs>

      {!account ? (
        <Flex marginTop="30px" alignItems="center" flexDirection="column" sx={{ gap: '16px' }}>
          <Text textAlign="center" color={theme.subText}>
            <Trans>Please connect wallet to view your Dashboard</Trans>
          </Text>
          <ButtonPrimary width="180px" onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonPrimary>
        </Flex>
      ) : tab === CampaignType.SafePal ? (
        <SafePalDashboard />
      ) : tab === CampaignType.Raffle ? (
        <RaffleDashboard />
      ) : tab === CampaignType.NearIntents ? (
        <NearIntentDashboard />
      ) : (
        <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
          <Box
            sx={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: upToSmall ? '1fr' : '1fr 1fr 1fr',
              marginBottom: '24px',
            }}
          >
            <div>
              <Text color={theme.subText}>
                <Trans>Total point earned</Trans>
              </Text>
              <Text marginTop="8px" fontSize={18} fontWeight="500">
                {formatDisplayNumber(Math.floor(data?.data?.totalPoint || 0), { significantDigits: 4 })}
              </Text>
            </div>
            <div>
              <Text color={theme.subText}>
                <Trans>Total est. rewards</Trans> {infor}
              </Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src={rewardTokenLogo}
                  alt={rewardTokenSymbol}
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />
                <Text fontSize={18} fontWeight="500">
                  {formatDisplayNumber(totalRewardByCampaign.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber((+totalRewardByCampaign.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Text>
              </Flex>
            </div>
            <div>
              <Text color={theme.subText}>
                <Trans>Total Claim-able rewards</Trans>
              </Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src={rewardTokenLogo}
                  alt={rewardTokenSymbol}
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />

                <Text fontSize={18} fontWeight="500">
                  {formatDisplayNumber(claimableRewardByCampaign.toFixed(4), { significantDigits: 6 })}{' '}
                  {rewardTokenSymbol}{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber((+claimableRewardByCampaign.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Text>
              </Flex>
            </div>
          </Box>

          <Divider />

          {!upToSmall && (
            <>
              <TableHeader>
                <Text>
                  <Trans>WEEK</Trans>
                </Text>
                <Text textAlign="right">
                  <Trans>POINTS EARNED</Trans>
                </Text>
                <Text textAlign="right">
                  <Trans>ESTIMATED REWARDS</Trans> {infor}
                </Text>
                <Text textAlign="right">
                  <Trans>TOTAL CLAIMABLE REWARDS</Trans>
                </Text>
              </TableHeader>
              <Divider />
            </>
          )}

          {!data?.data?.weeklyRewards?.length && (
            <Text color={theme.subText} textAlign="center" marginTop="24px">
              <Trans>No data found</Trans>
            </Text>
          )}
          {data?.data?.weeklyRewards?.map((item, idx) => {
            const rw = item.reward.split('.')[0]
            const totalRw = CurrencyAmount.fromRawAmount(mockToken, rw)

            const claimable = item.claimableReward?.split('.')?.[0] || '0'
            const claimableRw = CurrencyAmount.fromRawAmount(mockToken, claimable)
            const canClaim = claimable !== '0' && !item.isClaimed

            const date = getDateOfWeek(item.week, item.year)
            const end = getDateOfWeek(item.week + 1, item.year)
            end.setHours(end.getHours() - 1)

            if (upToSmall)
              return (
                <Box paddingY="1rem" sx={{ borderBottom: `1px solid ${theme.border}` }} key={idx}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text color={theme.subText}>
                      <Trans>Week {item.week - baseWeek}:</Trans> {dayjs(date).format('MMM DD')} -{' '}
                      {dayjs(end).format('MMM DD')}
                    </Text>
                    {!canClaim ? (
                      <ButtonOutlined width="88px" height="32px" disabled>
                        {item.isClaimed ? <Trans>Claimed</Trans> : <Trans>Claim</Trans>}
                      </ButtonOutlined>
                    ) : (
                      <ClaimButton info={item.claimInfo} />
                    )}
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="1rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>POINTS EARNED</Trans>
                    </Text>
                    <Text textAlign="right">
                      {formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}
                    </Text>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>ESTIMATED REWARDS</Trans> {infor}
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>
                        {formatDisplayNumber(totalRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                      </Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber((+totalRw.toExact() * price).toFixed(4), {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      <Trans>CLAIMABLE REWARDS</Trans>
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>
                        {formatDisplayNumber(claimableRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                      </Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(4), {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              )

            return (
              <TableRow key={`${item.year}-${item.week}`}>
                <Text color={theme.subText}>
                  <Trans>Week {item.week - baseWeek}:</Trans> {dayjs(date).format('MMM DD')} -{' '}
                  {dayjs(end).format('MMM DD')}
                </Text>
                <Text textAlign="right">
                  {formatDisplayNumber(Math.floor(item.point * 10) / 10, { significantDigits: 4 })}
                </Text>
                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>
                    {formatDisplayNumber(totalRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                  </Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber((+totalRw.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>
                    {formatDisplayNumber(claimableRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                  </Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end">
                  {!canClaim ? (
                    <ButtonOutlined width="88px" height="32px" disabled>
                      {item.isClaimed ? <Trans>Claimed</Trans> : <Trans>Claim</Trans>}
                    </ButtonOutlined>
                  ) : (
                    <ClaimButton info={item.claimInfo} />
                  )}
                </Flex>
              </TableRow>
            )
          })}
        </Box>
      )}
    </Wrapper>
  )
}

export default MyDashboard
