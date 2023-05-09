import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Box, Flex } from 'rebass'
import { PoolEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { calculateEarningStatsTick } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

import OriginalEarningsBreakdownPanel from '../EarningsBreakdownPanel'
import OriginalMyEarningsOverTimePanel from '../MyEarningsOverTimePanel'

const EarningsBreakdownPanel = styled(OriginalEarningsBreakdownPanel)`
  border: none;
  background: unset;
`

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  border: none;
  background: unset;
`

// TODO: handle empty data in a specific chain
// TODO: update the data to pool's data

type Props = {
  chainId: ChainId
  poolEarning: PoolEarningWithDetails
}
const PoolEarningsSection: React.FC<Props> = ({ poolEarning, chainId }) => {
  const theme = useTheme()
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const data = poolEarning.historicalEarning
    const latestData =
      data?.[0].total
        ?.filter(tokenData => {
          // TODO: check with native token
          const tokenAddress = isAddress(chainId, tokenData.token)
          if (!tokenAddress) {
            return false
          }

          const currency = tokensByChainId[chainId][tokenAddress]
          return !!currency
        })
        .map(tokenData => {
          const tokenAddress = isAddress(chainId, tokenData.token)
          const currency = tokensByChainId[chainId][String(tokenAddress)]
          return {
            address: tokenAddress,
            logoUrl: currency.logoURI,
            symbol: currency.symbol || '',
            amountUSD: Number(tokenData.amountUSD),
            chainId,
          }
        }) || []
    latestData.sort((data1, data2) => data2.amountUSD - data1.amountUSD)

    const totalValue = latestData.reduce((sum, { amountUSD }) => {
      return sum + amountUSD
    }, 0)

    const totalValueOfOthers = latestData.slice(9).reduce((acc, data) => acc + data.amountUSD, 0)

    const breakdowns: EarningsBreakdown['breakdowns'] =
      latestData.length <= 10
        ? latestData.map(data => ({
            logoUrl: data.logoUrl,
            symbol: data.symbol,
            value: String(data.amountUSD),
            percent: (data.amountUSD / totalValue) * 100,
          }))
        : [
            ...latestData.slice(0, 9).map(data => ({
              logoUrl: data.logoUrl,
              symbol: data.symbol,
              value: String(data.amountUSD),
              percent: (data.amountUSD / totalValue) * 100,
            })),
            {
              symbol: t`Others`,
              value: String(totalValueOfOthers),
              percent: (totalValueOfOthers / totalValue) * 100,
            },
          ]

    return {
      totalValue,
      breakdowns,
    }
  }, [chainId, poolEarning.historicalEarning, tokensByChainId])

  // format pool value
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateEarningStatsTick(poolEarning.historicalEarning, chainId, tokensByChainId)
  }, [chainId, poolEarning.historicalEarning, tokensByChainId])

  return (
    <Flex
      sx={{
        background: theme.buttonBlack,
        borderRadius: '20px',
      }}
    >
      <EarningsBreakdownPanel isLoading={false} data={earningBreakdown} />
      <Box
        sx={{
          flex: '0 0 1px',
          alignSelf: 'stretch',
          padding: '24px 0',
          width: '1px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: theme.border,
            opacity: 0.5,
          }}
        />
      </Box>
      <MyEarningsOverTimePanel isLoading={false} ticks={ticks} />
    </Flex>
  )
}

export default PoolEarningsSection
