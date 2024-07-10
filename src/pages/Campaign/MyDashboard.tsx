import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
// import { rgba } from 'polished'
// import { Share2 } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetUserReferralTotalRewardQuery, useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import banner from './assets/banner.png'
import ClaimBtn from './components/ClaimBtn'
import MyReferralDashboard from './components/MyReferralDashboard'
import { Tab, Tabs, Wrapper } from './styles'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.25fr 100px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 1rem;
  gap: 1rem;
  font-weight: 500;
`

const TableRow = styled(TableHeader)`
  font-size: 1rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  align-items: center;
`

const mockToken = new Token(1, ZERO_ADDRESS, 18, 'mock')

function getDateOfWeek(w: number, y: number) {
  const d = 1 + (w - 1) * 7 // 1st of January + 7 days for each week
  return new Date(y, 0, d)
}

const BASE_WEEK = 27

const MyDashboard = () => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'trading-incentive'
  const changeTab = (t: string) => {
    searchParams.set('tab', t)
    setSearchParams(searchParams)
  }

  const marketPriceMap = useTokenPrices(['0x912CE59144191C1204E64559FE8253a0e49E6548'], ChainId.ARBITRUM)
  const price = marketPriceMap?.['0x912CE59144191C1204E64559FE8253a0e49E6548'] || 0

  const { data: trading } = useGetUserWeeklyRewardQuery(
    {
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const { data: loData } = useGetUserWeeklyRewardQuery(
    {
      campaign: 'limit-order-farming',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const data = tab === 'trading-incentive' ? trading : loData

  const tradingRw = CurrencyAmount.fromRawAmount(mockToken, trading?.data?.totalReward?.split('.')[0] || '0')
  const loRw = CurrencyAmount.fromRawAmount(mockToken, loData?.data?.totalReward?.split('.')[0] || '0')

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { wallet: account || '' },
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

  const referralRewardUsd = +referralReward * price

  const totalRw = formatDisplayNumber((+tradingRw.toExact() + +loRw.toExact() + +referralReward).toFixed(3), {
    significantDigits: 6,
  })
  const totalRwUsd = formatDisplayNumber(
    (referralRewardUsd + (+tradingRw.toExact() + +loRw.toExact()) * price).toFixed(3),
    {
      significantDigits: 6,
      style: 'currency',
    },
  )

  const tradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    trading?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const loClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    loData?.data?.totalClaimableReward?.split('.')[0] || '0',
  )

  const totalClaimableRw = formatDisplayNumber((+tradingClaimableRw.toExact() + +loClaimableRw.toExact()).toFixed(3), {
    significantDigits: 6,
  })
  const totalClaimableRwUsd = formatDisplayNumber(
    ((+tradingClaimableRw.toExact() + +loClaimableRw.toExact()) * price).toFixed(3),
    {
      significantDigits: 6,
      style: 'currency',
    },
  )

  const totalRewardByCampaign = CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0')
  const claimableRewardByCampaign = CurrencyAmount.fromRawAmount(
    mockToken,
    data?.data?.totalClaimableReward?.split('.')[0] || '0',
  )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const infor = (
    <InfoHelper
      text={
        <Text>
          The Estimated Rewards will vary based on the points earned by you and all campaign participants during the
          week. Check out how they are calculated in the{' '}
          <StyledInternalLink
            to={
              tab === 'trading-incentive'
                ? '/campaigns/aggregator?tab=information'
                : tab === 'limit-order-farming'
                ? '/campaigns/limit-order?tab=information'
                : '/campaigns/referrals?tab=information'
            }
          >
            Information
          </StyledInternalLink>{' '}
          tab.
        </Text>
      }
    />
  )

  return (
    <Wrapper>
      <img src={banner} width="100%" alt="banner" style={{ borderRadius: '12px' }} />
      <Text fontSize={24} fontWeight="500" marginTop="1.5rem" mb="1.5rem">
        My Dashboard
      </Text>

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
            <Text>My total estimated rewards {infor}</Text>
            {/* TODO 
            <Flex
              role="button"
              alignItems="center"
              color={theme.primary}
              backgroundColor={rgba(theme.buttonBlack, 0.48)}
              padding="8px 16px"
              sx={{ borderRadius: '999px', gap: '4px', cursor: 'pointer' }}
              fontSize={14}
              fontWeight="500"
            >
              <Share2 size={14} /> Share
            </Flex>
            */}
          </Flex>
          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text fontWeight="500">{totalRw} ARB</Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {totalRwUsd}
            </Text>
          </Flex>

          <Text marginTop="8px" fontStyle="italic" color="#FfFfFA99">
            Total estimated rewards of all 3 campaigns (Aggregator, Limit Order, Referral)
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
          <Text>My claim-able rewards</Text>

          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text fontWeight="500">{totalClaimableRw} ARB</Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {totalClaimableRwUsd}
            </Text>
          </Flex>

          <Text marginTop="8px" fontStyle="italic" color="#FfFfFA99">
            Total final rewards that you can claim of all 3 campaigns (Aggregator, Limit Order, Referral)
          </Text>
        </Box>
      </Flex>

      <Tabs>
        <Tab role="button" active={tab === 'trading-incentive'} onClick={() => changeTab('trading-incentive')}>
          Trading
        </Tab>
        <Tab role="button" active={tab === 'limit-order-farming'} onClick={() => changeTab('limit-order-farming')}>
          Limit Order
        </Tab>
        <Tab role="button" active={tab === 'referral-program'} onClick={() => changeTab('referral-program')}>
          Referral
        </Tab>
      </Tabs>

      {!account ? (
        <Text marginTop="30px" textAlign="center" color={theme.subText}>
          Please connect wallet to view your Dashboard
        </Text>
      ) : tab === 'referral-program' ? (
        <MyReferralDashboard price={price} infor={infor} />
      ) : (
        <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
          <Box
            sx={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: upToSmall ? '1fr' : '1fr 1fr 1fr',
              marginBottom: '28px',
            }}
          >
            <div>
              <Text color={theme.subText}>Total point earned</Text>
              <Text marginTop="8px" fontSize={18} fontWeight="500">
                {formatDisplayNumber(Math.floor(data?.data?.totalPoint || 0), { significantDigits: 4 })}
              </Text>
            </div>
            <div>
              <Text color={theme.subText}>Total Estimated rewards {infor}</Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
                  alt="arb"
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />
                <Text fontSize={18} fontWeight="500">
                  {formatDisplayNumber(totalRewardByCampaign.toFixed(3), { significantDigits: 6 })} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber((+totalRewardByCampaign.toExact() * price).toFixed(3), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Text>
              </Flex>
            </div>
            <div>
              <Text color={theme.subText}>Total Claim-able rewards</Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
                  alt="arb"
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />

                <Text fontSize={18} fontWeight="500">
                  {formatDisplayNumber(claimableRewardByCampaign.toFixed(3), { significantDigits: 6 })} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber((+claimableRewardByCampaign.toExact() * price).toFixed(3), {
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
            <TableHeader>
              <Text>WEEK</Text>
              <Text textAlign="right">POINTS EARNED</Text>
              <Text textAlign="right">ESTIMATED REWARDS {infor}</Text>
              <Text textAlign="right">TOTAL CLAIMABLE REWARDS</Text>
            </TableHeader>
          )}

          <Divider />

          {!data?.data?.weeklyRewards?.length && (
            <Text color={theme.subText} textAlign="center" marginTop="24px">
              No data found
            </Text>
          )}
          {data?.data?.weeklyRewards?.map(item => {
            const rw = item.reward.split('.')[0]
            const totalRw = CurrencyAmount.fromRawAmount(mockToken, rw)

            const claimable = item.claimableReward.split('.')[0]
            const claimableRw = CurrencyAmount.fromRawAmount(mockToken, claimable)
            const canClaim = claimable !== '0' && !item.isClaimed

            const date = getDateOfWeek(item.week, item.year)
            const end = getDateOfWeek(item.week + 1, item.year)
            end.setHours(end.getHours() - 1)

            if (upToSmall)
              return (
                <Box paddingY="1rem" sx={{ borderBottom: `1px solid ${theme.border}` }}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text color={theme.subText}>
                      Week {item.week - BASE_WEEK}: {dayjs(date).format('MMM DD')} - {dayjs(end).format('MMM DD')}
                    </Text>
                    {!canClaim ? (
                      <ButtonOutlined width="88px" height="32px" disabled>
                        {item.isClaimed ? 'Claimed' : 'Claim'}
                      </ButtonOutlined>
                    ) : (
                      <ClaimBtn info={item.claimInfo} />
                    )}
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="1rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      POINTS EARNED
                    </Text>
                    <Text textAlign="right">
                      {formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}
                    </Text>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      ESTIMATED REWARDS {infor}
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>{formatDisplayNumber(totalRw.toFixed(3), { significantDigits: 6 })} ARB</Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber((+totalRw.toExact() * price).toFixed(3), {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      CLAIMABLE REWARDS
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>{formatDisplayNumber(claimableRw.toFixed(3), { significantDigits: 6 })} ARB</Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(3), {
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
                  Week {item.week - BASE_WEEK}: {dayjs(date).format('MMM DD')} - {dayjs(end).format('MMM DD')}
                </Text>
                <Text textAlign="right">{formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}</Text>
                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{formatDisplayNumber(totalRw.toFixed(3), { significantDigits: 6 })} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber((+totalRw.toExact() * price).toFixed(3), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{formatDisplayNumber(claimableRw.toFixed(3), { significantDigits: 6 })} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(3), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end">
                  {!canClaim ? (
                    <ButtonOutlined width="88px" height="32px" disabled>
                      {item.isClaimed ? 'Claimed' : 'Claim'}
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
