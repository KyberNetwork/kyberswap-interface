import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import { REWARD_SERVICE_API } from 'constants/env'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'
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

  const data = tab === 'trading' ? trading : loData

  const tradingRw = CurrencyAmount.fromRawAmount(mockToken, trading?.data?.totalReward?.split('.')[0] || '0')
  const loRw = CurrencyAmount.fromRawAmount(mockToken, loData?.data?.totalReward?.split('.')[0] || '0')
  const totalRw = formatDisplayNumber(+tradingRw.toExact() + +loRw.toExact(), { significantDigits: 6 })
  const totalRwUsd = formatDisplayNumber((+tradingRw.toExact() + +loRw.toExact()) * price, {
    significantDigits: 6,
    style: 'currency',
  })

  const tradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    trading?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const loClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    loData?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const totalClaimableRw = formatDisplayNumber(+tradingClaimableRw.toExact() + +loClaimableRw.toExact(), {
    significantDigits: 6,
  })
  const totalClaimableRwUsd = formatDisplayNumber((+tradingClaimableRw.toExact() + +loClaimableRw.toExact()) * price, {
    significantDigits: 6,
    style: 'currency',
  })

  const totalRewardByCampaign = CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0')
  const claimableRewardByCampaign = CurrencyAmount.fromRawAmount(
    mockToken,
    data?.data?.totalClaimableReward?.split('.')[0] || '0',
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

      <Flex sx={{ gap: '1rem', marginTop: '24px' }}></Flex>

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
                  {totalRewardByCampaign.toSignificant(6)} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber(+totalRewardByCampaign.toExact() * price, {
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
                  {claimableRewardByCampaign.toSignificant(6)} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber(+claimableRewardByCampaign.toExact() * price, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
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
            const totalRw = CurrencyAmount.fromRawAmount(mockToken, rw)

            const claimable = item.claimableReward.split('.')[0]
            const claimableRw = CurrencyAmount.fromRawAmount(mockToken, claimable)
            const canClaim = claimable !== '0' && !item.isClaimed

            return (
              <TableRow key={`${item.year}-${item.week}`}>
                <Text color={theme.subText}>Week {item.week}</Text>
                <Text textAlign="right">{formatDisplayNumber(item.point, { significantDigits: 6 })}</Text>
                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{totalRw.toSignificant(6)} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber(+totalRw.toExact() * price, { significantDigits: 4, style: 'currency' })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{claimableRw.toSignificant(6)} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber(+claimableRw.toExact() * price, { significantDigits: 4, style: 'currency' })}
                  </Text>
                </Flex>

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
  const { account } = useActiveWeb3React()
  const [claiming, setIsClaiming] = useState(false)
  const notify = useNotify()
  const { library } = useWeb3React()

  const addTransactionWithType = useTransactionAdder()

  const handleClaim = () => {
    if (!account) return
    setIsClaiming(true)
    fetch(`${REWARD_SERVICE_API}/rewards/claim`, {
      method: 'POST',
      body: JSON.stringify({
        wallet: account,
        chainId: '42161',
        clientCode: info.clientCode,
        ref: info.ref,
      }),
    })
      .then(res => res.json())
      .then(res => {
        if (!res?.data?.EncodedData) {
          notify(
            {
              title: 'Claim failed',
              summary: res?.message || 'Something went wrong',
              type: NotificationType.ERROR,
            },
            5000,
          )
          return
        }

        library
          ?.getSigner()
          .estimateGas({
            to: res.data.ContractAddress,
            data: res.data.EncodedData,
          })
          .then(async (estimate: BigNumber) => {
            const sendTxRes = await library.getSigner().sendTransaction({
              to: res.data.ContractAddress,
              data: res.data.EncodedData,
              gasLimit: calculateGasMargin(estimate),
            })

            addTransactionWithType({
              hash: sendTxRes.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
          })
      })
      .finally(() => {
        setIsClaiming(false)
      })
  }
  return (
    <ButtonOutlined color={theme.primary} width="88px" height="32px" onClick={handleClaim} disabled={claiming}>
      {claiming ? 'Claiming' : 'Claim'}
    </ButtonOutlined>
  )
}
