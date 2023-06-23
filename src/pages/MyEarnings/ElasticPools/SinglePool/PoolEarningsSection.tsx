import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex } from 'rebass'
import { HistoricalSingleData } from 'services/earning/types'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { calculateEarningStatsTick, today } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

import OriginalEarningsBreakdownPanel from '../../EarningsBreakdownPanel'
import OriginalMyEarningsOverTimePanel from '../../MyEarningsOverTimePanel'

const VerticalSeparator = () => {
  const theme = useTheme()
  return (
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
  )
}

const HorizontalSeparator = () => {
  const theme = useTheme()
  return (
    <Box
      sx={{
        flex: '0 0 1px',
        alignSelf: 'stretch',
        width: '100%',
        borderBottom: '1px solid transparent',
        borderBottomColor: theme.border,
      }}
    />
  )
}

const EarningsBreakdownPanel = styled(OriginalEarningsBreakdownPanel)`
  border: none;
  background: unset;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0;
    width: 100%;
    flex: 0 0 auto;
  `}
`

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  border: none;
  background: unset;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    border-radius: 0;
    padding: 0;
    flex: 0 0 420px;
  `}
`

// TODO: handle empty data in a specific chain
// TODO: update the data to pool's data

type Props = {
  chainId: ChainId
  historicalEarning: HistoricalSingleData[]
}
const PoolEarningsSection: React.FC<Props> = ({ historicalEarning, chainId }) => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const data = historicalEarning

    const latestData =
      data?.[0]?.day === today
        ? data?.[0].total
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
        : []
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
  }, [chainId, historicalEarning, tokensByChainId])

  // format pool value
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateEarningStatsTick(historicalEarning, chainId, tokensByChainId)
  }, [chainId, historicalEarning, tokensByChainId])

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <EarningsBreakdownPanel isLoading={false} data={earningBreakdown} />
        <HorizontalSeparator />
        <MyEarningsOverTimePanel isLoading={false} ticks={ticks} isContainerSmall />
      </Flex>
    )
  }

  return (
    <Flex
      sx={{
        background: theme.buttonBlack,
        borderRadius: '20px',
      }}
    >
      <EarningsBreakdownPanel isLoading={false} data={earningBreakdown} />
      <VerticalSeparator />
      <MyEarningsOverTimePanel isLoading={false} ticks={ticks} />
    </Flex>
  )
}

export default PoolEarningsSection
