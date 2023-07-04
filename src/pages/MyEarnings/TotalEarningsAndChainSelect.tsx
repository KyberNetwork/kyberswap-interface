import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Flex } from 'rebass'
import earningApi, { useLazyGetElasticEarningQuery, useLazyGetElasticLegacyEarningQuery } from 'services/earning'
import styled from 'styled-components'

import { ReactComponent as RefreshIcon } from 'assets/svg/refresh.svg'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import ShareTotalEarningsButton from 'pages/MyEarnings/ShareTotalEarningsButton'
import { useAppSelector } from 'state/hooks'

// TODO: move to common
const formatPercent = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

const formatValue = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })

  return formatter.format(value)
}

const Value = styled.span`
  max-width: 100%;
  display: inline-flex;
  font-weight: 500;
  font-size: 36px;
  line-height: 44px;
  flex: 0 0 max-content;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const RefreshButton = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const { account } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const [elasticTrigger, elasticData] = useLazyGetElasticEarningQuery()
  const [elasticLegacyTrigger, elasticLegacyData] = useLazyGetElasticLegacyEarningQuery()
  // const [classicTrigger, classicData] = useLazyGetClassicEarningQuery()

  const isFetching = elasticData.isFetching || elasticLegacyData.isFetching

  const refetch = useCallback(() => {
    if (isFetching || !account) {
      return
    }

    dispatch(earningApi.util.resetApiState())
    elasticTrigger({ account, chainIds: selectedChainIds })
    elasticLegacyTrigger({ account, chainIds: selectedChainIds })
    // classicTrigger({ account, chainIds: selectedChainIds })

    setTimeout(refetch, 300_000)
  }, [account, dispatch, elasticLegacyTrigger, elasticTrigger, isFetching, selectedChainIds])

  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    setTimeout(() => {
      refetchRef.current()
    }, 300_000)
  }, [])

  return (
    <Button
      sx={{
        display: 'flex',
        flex: '0 0 36px',
        alignItems: 'center',
        justifyContent: 'center',
        height: '36px',
        borderRadius: '999px',
        color: isFetching ? rgba(theme.subText, 0.4) : theme.subText,
        background: theme.background,
        padding: '0',
        margin: '0',
        cursor: 'pointer',
      }}
      disabled={isFetching}
      onClick={refetch}
    >
      <RefreshIcon width="17px" height="17px" />
    </Button>
  )
}

type Props = {
  totalEarningToday: number
  totalEarningYesterday: number
}
const TotalEarningsAndChainSelect: React.FC<Props> = ({ totalEarningToday, totalEarningYesterday }) => {
  const theme = useTheme()

  if (Number.isNaN(totalEarningToday)) {
    return <Value>--</Value>
  }

  const totalValue = formatValue(totalEarningToday)

  const diffPercent =
    totalEarningYesterday && !Number.isNaN(totalEarningYesterday)
      ? formatPercent(totalEarningToday / totalEarningYesterday - 1)
      : ''

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      <Value>{totalValue}</Value>

      <Flex
        sx={{
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'nowrap',
          flex: '0 0 max-content',
        }}
      >
        {diffPercent ? (
          <MouseoverTooltip
            text={t`This indicates change in the value of your earnings in the last 24H`}
            placement="top"
          >
            <Flex
              sx={{
                flex: '0 0 content',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px',
                padding: '0 12px',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: diffPercent.startsWith('-') ? theme.red : theme.primary,
                background: rgba(diffPercent.startsWith('-') ? theme.red : theme.primary, 0.3),
                borderRadius: '999px',
              }}
            >
              <span>{diffPercent}</span>
            </Flex>
          </MouseoverTooltip>
        ) : null}

        <ShareTotalEarningsButton totalValue={totalEarningToday} />
        <RefreshButton />
      </Flex>
    </Flex>
  )
}

export default TotalEarningsAndChainSelect
