import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetElasticEarningQuery, useGetElasticLegacyEarningQuery } from 'services/earning'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import ChainSelect from 'pages/MyEarnings/ChainSelect'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import TotalEarningsAndChainSelect from 'pages/MyEarnings/TotalEarningsAndChainSelect'
import { calculateEarningBreakdowns, calculateTicksOfAccountEarningsInMultipleChains } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'

import OriginalEarningsBreakdownPanel from '../EarningsBreakdownPanel'
import OriginalMyEarningsOverTimePanel from '../MyEarningsOverTimePanel'

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  flex: 1 0 640px;
  border-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex: 1 1 100%;
    height: 480px;
  `}
`

const EarningsBreakdownPanel = styled(OriginalEarningsBreakdownPanel)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex: 1;

    &[data-columns='2'] {
      width: 100%;
      flex: 1;
    }
  `}
`

const ChainSelectAndEarningsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    align-items: initial;
    justify-content: initial;

    ${MultipleChainSelect} {
      flex: 1;
    }
  `}
`

const MyEarningStats = () => {
  const { account = '' } = useActiveWeb3React()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  // const getEarningData = useGetEarningDataQuery({ account, chainIds: selectedChainIds })
  const elasticEarningQueryResponse = useGetElasticEarningQuery({ account, chainIds: selectedChainIds })
  const elasticLegacyEarningQueryResponse = useGetElasticLegacyEarningQuery({ account, chainIds: selectedChainIds })

  const isLoading = elasticEarningQueryResponse.isFetching || elasticLegacyEarningQueryResponse.isFetching

  // chop the data into the right duration
  // format pool value
  // multiple chains
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateTicksOfAccountEarningsInMultipleChains(
      [elasticEarningQueryResponse.data, elasticLegacyEarningQueryResponse.data],
      tokensByChainId,
    )
  }, [elasticEarningQueryResponse, elasticLegacyEarningQueryResponse, tokensByChainId])

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    return calculateEarningBreakdowns(ticks?.[0])
  }, [ticks])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <ChainSelectAndEarningsWrapper>
        <TotalEarningsAndChainSelect
          totalEarningToday={Number(ticks?.[0]?.totalValue)}
          totalEarningYesterday={Number(ticks?.[1]?.totalValue || 0)}
        />
        <ChainSelect />
      </ChainSelectAndEarningsWrapper>

      <Flex
        sx={{
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <EarningsBreakdownPanel isLoading={isLoading} data={earningBreakdown} />
        <MyEarningsOverTimePanel isLoading={isLoading} ticks={ticks} isContainerSmall={upToExtraSmall} />
      </Flex>

      <Text
        sx={{
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '16px',
          fontStyle: 'italic',
          textAlign: 'center',
          color: theme.subText,
          marginBottom: '16px',
        }}
      >
        <Trans>
          Note: Your earnings may fluctuate due to the increase or decrease in price of the tokens earned. These
          earnings include both claimed and unclaimed pool and farm rewards
        </Trans>
      </Text>
    </Flex>
  )
}

export default MyEarningStats
