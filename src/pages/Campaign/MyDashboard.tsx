import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import loBanner from './assets/limit_order.png'
import referralBanner from './assets/referral.png'
import tradingBanner from './assets/trading.png'
import { Tab, Tabs, Wrapper } from './styles'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr 1.25fr 1fr;
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

const MyDashboard = () => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'trading'
  const changeTab = (t: string) => {
    searchParams.set('tab', t)
    setSearchParams(searchParams)
  }

  const { data } = useGetUserWeeklyRewardQuery(
    {
      campaign: tab === 'trading' ? 'trading-incentive' : tab === 'lo' ? 'limit-order-farming' : 'referral',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  return (
    <Wrapper>
      <img
        src={tab === 'trading' ? tradingBanner : tab === 'lo' ? loBanner : referralBanner}
        width="100%"
        alt="banner"
        style={{ borderRadius: '12px' }}
      />
      <Text fontSize={24} fontWeight="500" marginTop="1.5rem" mb="1.5rem">
        My Dashboard
      </Text>

      <Flex sx={{ gap: '1rem' }}></Flex>

      <Tabs>
        <Tab role="button" active={tab === 'trading'} onClick={() => changeTab('trading')}>
          Trading
        </Tab>
        <Tab role="button" active={tab === 'lo'} onClick={() => changeTab('lo')}>
          Limit Order
        </Tab>
        <Tab role="button" active={tab === 'referral'} onClick={() => changeTab('referral')}>
          Referral
        </Tab>
      </Tabs>

      {!account ? (
        <Text marginTop="30px" textAlign="center" color={theme.subText}>
          Please connect wallet to view your Dashboard
        </Text>
      ) : (
        <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
          <Box
            sx={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: '1fr 1fr 1fr',
              marginBottom: '28px',
            }}
          >
            <div>
              <Text color={theme.subText}>Total point earned</Text>
              <Text marginTop="8px" fontSize={18} fontWeight="500">
                {formatDisplayNumber(data?.data?.totalPoint || 0, { significantDigits: 6 })}
              </Text>
            </div>
            <div>
              <Text color={theme.subText}>Total Estimated rewards</Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
                  alt="arb"
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />
                <Text fontSize={18} fontWeight="500">
                  {CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0').toSignificant(
                    6,
                  )}{' '}
                  ARB
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
                  {CurrencyAmount.fromRawAmount(
                    mockToken,
                    data?.data?.totalClaimableReward?.split('.')[0] || '0',
                  ).toSignificant(6)}{' '}
                  ARB
                </Text>
              </Flex>
            </div>
          </Box>

          <Divider />

          <TableHeader>
            <Text>WEEK</Text>
            <Text textAlign="right">POINTS EARNED</Text>
            <Text textAlign="right">ESTIMATED REWARDS</Text>
            <Text textAlign="right">TOTAL CLAIMABLE REWARDS</Text>
          </TableHeader>

          <Divider />

          {!data?.data?.weeklyRewards?.length && (
            <Text color={theme.subText} textAlign="center" marginTop="24px">
              No data found
            </Text>
          )}
          {data?.data?.weeklyRewards?.map(item => {
            const rw = item.reward.split('.')[0]
            const claimable = item.claimableReward.split('.')[0]
            const canClaim = claimable !== '0' && !item.isClaimed
            return (
              <TableRow key={`${item.year}-${item.week}`}>
                <Text color={theme.subText}>Week {item.week}</Text>
                <Text textAlign="right">{formatDisplayNumber(item.point, { significantDigits: 6 })}</Text>
                <Text textAlign="right">{CurrencyAmount.fromRawAmount(mockToken, rw).toSignificant(6)} ARB</Text>
                <Text textAlign="right">{CurrencyAmount.fromRawAmount(mockToken, claimable).toSignificant(6)} ARB</Text>

                <Flex justifyContent="flex-end">
                  {!canClaim ? (
                    <ButtonOutlined width="88px" height="32px" disabled>
                      Claimed
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

const ClaimBtn = ({ info }: { info: { ref: string; clientCode: string } }) => {
  const theme = useTheme()
  console.log(info)
  return (
    <ButtonOutlined color={theme.primary} width="88px" height="32px">
      Claim
    </ButtonOutlined>
  )
}
