import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetUserReferralTotalRewardQuery, useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { TokenLogoWithChain } from 'components/Logo'
import { NewLabel } from 'components/Menu'
import Modal from 'components/Modal'
import { APP_PATHS, ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'
import { useNavigateToUrl } from 'utils/redirect'

import ClaimBtn from './components/ClaimBtn'
import MyNearIntentDashboard from './components/MyDashboard/MyNearIntentDashboard'
import MyRaffleDashboard from './components/MyDashboard/MyRaffleDashboard'
import MyReferralDashboard from './components/MyDashboard/MyReferralDashboard'
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

const ELabel = styled.span`
  font-size: 10px;
  margin-left: 4px;
`

export function getDateOfWeek(w: number, y: number) {
  const first = y === 2025 ? -1 : 1 // 1st of January
  const d = first + (w - 1) * 7 // 1st of January + 7 days for each week
  return new Date(y, 0, d)
}

const NEW_CAMPAIGN = CampaignType.Raffle

const MyDashboard = () => {
  const { account } = useActiveWeb3React()
  const navigate = useNavigateToUrl()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: CampaignType = (searchParams.get('tab') || NEW_CAMPAIGN) as CampaignType
  const changeTab = (t: CampaignType) => {
    searchParams.set('tab', t)
    setSearchParams(searchParams)
  }

  const { reward, baseWeek, banner } = campaignConfig[tab]

  const campaignLabelMap: Record<CampaignType, string> = {
    [CampaignType.Raffle]: t`Raffle`,
    [CampaignType.NearIntents]: t`Cross Chain`,
    [CampaignType.MayTrading]: t`May Trading`,
    [CampaignType.Aggregator]: t`Trading`,
    [CampaignType.LimitOrder]: t`Limit Order`,
    [CampaignType.Referrals]: t`Referral`,
  }

  const mockToken = new Token(1, ZERO_ADDRESS, 18, 'mock')

  const stipReward = campaignConfig[CampaignType.Aggregator].reward
  const mayTradingReward = campaignConfig[CampaignType.MayTrading].reward

  const rewardTokenLogo = reward.logo
  const rewardTokenSymbol = reward.symbol

  const stipRewardPrice = useTokenPrices([stipReward.address], stipReward.chainId)?.[stipReward.address] || 0
  const mayTradingRewardPrice =
    useTokenPrices([mayTradingReward.address], mayTradingReward.chainId)?.[mayTradingReward.address] || 0

  const { data: mayTrading } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const { data: stipTrading } = useGetUserWeeklyRewardQuery(
    {
      program: 'stip',
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const { data: stipLoData } = useGetUserWeeklyRewardQuery(
    {
      program: 'stip',
      campaign: 'limit-order-farming',
      wallet: account || '',
    },
    {
      skip: !account,
    },
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

  const data = tab === CampaignType.MayTrading ? mayTrading : tab === CampaignType.Aggregator ? stipTrading : stipLoData

  const stipTradingRw = CurrencyAmount.fromRawAmount(mockToken, stipTrading?.data?.totalReward?.split('.')[0] || '0')
  const stipLoRw = CurrencyAmount.fromRawAmount(mockToken, stipLoData?.data?.totalReward?.split('.')[0] || '0')

  const mayTradingRw = CurrencyAmount.fromRawAmount(mockToken, mayTrading?.data?.totalReward?.split('.')[0] || '0')

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { program: 'stip', wallet: account || '' },
    {
      skip: !account,
    },
  )
  const referralReward = referralData?.data?.totalReward
    ? CurrencyAmount.fromRawAmount(
        new Token(1, ZERO_ADDRESS, 18, 'mock'),
        referralData?.data?.totalReward.split('.')[0] || '0',
      ).toExact()
    : '0'

  const referralRewardUsd = +referralReward * stipRewardPrice

  const totalMayTradingRw = formatDisplayNumber(+mayTradingRw.toExact(), { significantDigits: 6 })
  const totalMayTradingRwUsd = formatDisplayNumber(+mayTradingRw.toExact() * mayTradingRewardPrice, {
    significantDigits: 6,
    style: 'currency',
  })

  const totalStipRw = formatDisplayNumber(
    (+stipTradingRw.toExact() + +stipLoRw.toExact() + +referralReward).toFixed(3),
    {
      significantDigits: 6,
    },
  )
  const totalStipRwUsd = formatDisplayNumber(
    (referralRewardUsd + (+stipTradingRw.toExact() + +stipLoRw.toExact()) * stipRewardPrice).toFixed(3),
    {
      significantDigits: 6,
      style: 'currency',
    },
  )

  const stipTradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    account ? stipTrading?.data?.totalClaimableReward?.split('.')[0] || '0' : '0',
  )
  const stipLoClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    account ? stipLoData?.data?.totalClaimableReward?.split('.')[0] || '0' : '0',
  )
  const mayTradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    account ? mayTrading?.data?.totalClaimableReward?.split('.')[0] || '0' : '0',
  )

  const totalClaimableRw = formatDisplayNumber(
    (+stipTradingClaimableRw.toExact() + +stipLoClaimableRw.toExact()).toFixed(3),
    {
      significantDigits: 6,
    },
  )
  const totalClaimableRwUsd = formatDisplayNumber(
    ((+stipTradingClaimableRw.toExact() + +stipLoClaimableRw.toExact()) * stipRewardPrice).toFixed(3),
    {
      significantDigits: 6,
      style: 'currency',
    },
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
  const price = tab === CampaignType.MayTrading ? mayTradingRewardPrice : stipRewardPrice
  const [showModal, setShowModal] = useState(false)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const endedCampaigns = [
    {
      type: CampaignType.NearIntents,
      label: campaignLabelMap[CampaignType.NearIntents],
    },
    {
      type: CampaignType.MayTrading,
      label: campaignLabelMap[CampaignType.MayTrading],
    },
    {
      type: CampaignType.Aggregator,
      label: campaignLabelMap[CampaignType.Aggregator],
    },
    {
      type: CampaignType.LimitOrder,
      label: campaignLabelMap[CampaignType.LimitOrder],
    },
    {
      type: CampaignType.Referrals,
      label: campaignLabelMap[CampaignType.Referrals],
    },
  ]

  const endedCampaignsHaveRewards = endedCampaigns.filter(item => {
    if (item.type === tab) {
      return true
    }
    if (item.type === CampaignType.NearIntents) {
      return totalNearCampaignReward > 0n
    }
    if (item.type === CampaignType.MayTrading) {
      return Number(mayTrading?.data?.totalClaimableReward || '0') > 0
    }
    if (item.type === CampaignType.Aggregator) {
      return Number(stipTrading?.data?.totalClaimableReward || '0') > 0
    }
    if (item.type === CampaignType.LimitOrder) {
      return Number(stipLoData?.data?.totalClaimableReward || '0') > 0
    }
    if (item.type === CampaignType.Referrals) {
      return Number(referralReward || '0') > 0
    }
    return false
  })

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
        <IconArrowLeft
          style={{ cursor: 'pointer', position: 'relative', top: '7px' }}
          onClick={() => navigate(APP_PATHS.NEAR_INTENTS_CAMPAIGN)}
        />
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
          {account && stipTradingRw?.greaterThan('0') && (
            <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
              <TokenLogoWithChain chainId={stipReward.chainId} tokenLogo={stipReward.logo} size={24} />
              <Text fontWeight="500" ml="6px">
                {totalStipRw} {stipReward.symbol}
              </Text>
              <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
                {totalStipRwUsd}
              </Text>
            </Flex>
          )}
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

          {account && stipTradingRw?.greaterThan('0') && (
            <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
              <TokenLogoWithChain chainId={stipReward.chainId} tokenLogo={stipReward.logo} size={24} />
              <Text fontWeight="500" ml="6px">
                {totalClaimableRw} {stipReward.symbol}
              </Text>
              <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
                {totalClaimableRwUsd}
              </Text>
            </Flex>
          )}
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
            <NewLabel>
              <Trans>NEW</Trans>
            </NewLabel>
          </Flex>
        </Tab>
        {endedCampaignsHaveRewards.slice(0, upToSmall ? 1 : undefined).map(campaign => (
          <Tab
            key={campaign.type}
            role="button"
            active={tab === campaign.type}
            onClick={() => changeTab(campaign.type)}
          >
            <Flex>
              {campaign.label}
              <ELabel>
                <Trans>ENDED</Trans>
              </ELabel>
            </Flex>
          </Tab>
        ))}
        <Flex justifyContent="flex-end" flex={1}>
          <ButtonIcon onClick={() => setShowModal(true)}>
            <MoreHorizontal size={16} />
          </ButtonIcon>
        </Flex>
        <Modal
          isOpen={showModal}
          onDismiss={() => setShowModal(false)}
          maxHeight={90}
          maxWidth={600}
          bypassScrollLock={true}
          bypassFocusLock={true}
          zindex={99999}
          width="240px"
        >
          <Flex width="100%" flexDirection="column" padding="24px" sx={{ gap: '24px' }}>
            {endedCampaigns.map(campaign => (
              <Tab
                key={campaign.type}
                role="button"
                active={tab === campaign.type}
                onClick={() => {
                  changeTab(campaign.type)
                  setShowModal(false)
                }}
              >
                <Flex>
                  {campaign.label}
                  <ELabel>
                    <Trans>ENDED</Trans>
                  </ELabel>
                </Flex>
              </Tab>
            ))}
          </Flex>
        </Modal>
      </Tabs>

      {tab === CampaignType.NearIntents ? (
        <MyNearIntentDashboard />
      ) : !account ? (
        <Text marginTop="30px" textAlign="center" color={theme.subText}>
          <Trans>Please connect wallet to view your Dashboard</Trans>
        </Text>
      ) : tab === CampaignType.Referrals ? (
        <MyReferralDashboard price={stipRewardPrice} infor={infor} />
      ) : tab === CampaignType.Raffle ? (
        <MyRaffleDashboard />
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
                      <ClaimBtn info={item.claimInfo} />
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
                    <ClaimBtn info={item.claimInfo} />
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
