import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Flex } from 'rebass'
import earningApi, {
  useLazyGetClassicEarningQuery,
  useLazyGetElasticEarningQuery,
  useLazyGetElasticLegacyEarningQuery,
} from 'services/earning'
import styled, { keyframes } from 'styled-components'

import { ReactComponent as RefreshIcon } from 'assets/svg/refresh.svg'
import { MouseoverTooltip } from 'components/Tooltip'
import { EMPTY_FUNCTION } from 'constants/index'
import {
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC,
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY,
} from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import ShareTotalEarningsButton from 'pages/MyEarnings/ShareTotalEarningsButton'
import { useAppSelector } from 'state/hooks'
import { formatDisplayNumber } from 'utils/numbers'

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
const rotate = keyframes`
 from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`
const StyledRefreshIcon = styled(RefreshIcon)`
  width: 1rem;
  height: 1rem;
  animation: ${rotate} 1.5s linear infinite;
`

const RefreshButton = () => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const dispatch = useDispatch()
  const refetchRef = useRef(EMPTY_FUNCTION)
  const timeOutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const { account } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const [elasticTrigger, elasticData] = useLazyGetElasticEarningQuery()
  const [elasticLegacyTrigger, elasticLegacyData] = useLazyGetElasticLegacyEarningQuery()
  const [classicTrigger, classicData] = useLazyGetClassicEarningQuery()

  const isFetching = elasticData.isFetching || elasticLegacyData.isFetching || classicData.isFetching

  refetchRef.current = () => {
    if (isFetching || !account) {
      return
    }

    dispatch(earningApi.util.resetApiState())
    elasticTrigger({ account, chainIds: selectedChainIds })
    elasticLegacyTrigger({
      account,
      chainIds: selectedChainIds.filter(item => !COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY.includes(item)),
    })
    classicTrigger({
      account,
      chainIds: selectedChainIds.filter(item => !COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC.includes(item)),
    })
  }

  useEffect(() => {
    const cleanUp = () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current)
      }
    }

    if (isFetching || !account) {
      return cleanUp
    }

    timeOutRef.current = setTimeout(() => {
      refetchRef.current()
    }, 60_000)

    return cleanUp
  }, [account, isFetching])

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
      onClick={() => {
        mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_REFRESH_BUTTON)
        refetchRef.current()
      }}
    >
      {isFetching ? <StyledRefreshIcon /> : <RefreshIcon width="1rem" height="1rem" />}
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

  const totalValue = formatDisplayNumber(totalEarningToday, { style: 'currency', significantDigits: 6 })
  const diffPercent =
    totalEarningYesterday && !Number.isNaN(totalEarningYesterday)
      ? formatDisplayNumber(totalEarningToday / totalEarningYesterday - 1, {
          style: 'percent',
          fractionDigits: 2,
          significantDigits: 6,
          allowDisplayNegative: true,
        })
      : ''

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '0.5rem',
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
                padding: '4px 8px',
                fontWeight: 500,
                fontSize: '12px',
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
