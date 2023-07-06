import { ChainId } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ElasticPoolEarningWithDetails, ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { PoolState } from 'hooks/usePools'
import { usePoolv2 } from 'hooks/usePoolv2'
import useTheme from 'hooks/useTheme'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import StatsRow from 'pages/MyEarnings/ElasticPools/SinglePool/StatsRow'
import PoolEarningsSection from 'pages/MyEarnings/PoolEarningsSection'
import Positions from 'pages/MyEarnings/Positions'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress, shortenAddress } from 'utils'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

const Badge = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 2px 8px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  border-radius: 16px;

  user-select: none;

  color: ${({ $color, theme }) => $color || theme.subText};
  background: ${({ $color, theme }) => rgba($color || theme.subText, 0.3)};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    height: 16px;
    padding: 0 4px;
  `}
`

export type Props = {
  chainId: ChainId
  poolEarning: ElasticPoolEarningWithDetails
  positionEarnings: ElasticPositionEarningWithDetails[]
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, positionEarnings, pendingFees, tokenPrices }) => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const [isExpanded, setExpanded] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)

  const feeAmount = Number(poolEarning.feeTier) as FeeAmount

  const [currency0, currency1] = useMemo(() => {
    const tokenAddress0 = isAddress(chainId, poolEarning.token0.id)
    const tokenAddress1 = isAddress(chainId, poolEarning.token1.id)

    if (!tokenAddress0 || !tokenAddress1) {
      return []
    }

    const currency0 = tokensByChainId[chainId][tokenAddress0]
    const currency1 = tokensByChainId[chainId][tokenAddress1]

    return [currency0, currency1]
  }, [chainId, poolEarning.token0.id, poolEarning.token1.id, tokensByChainId])

  const { pool, poolState } = usePoolv2(chainId, currency0, currency1, feeAmount, poolEarning.id)
  const isExpandable = !!pool && poolState !== PoolState.LOADING

  // Need these because we'll display native tokens instead of wrapped tokens
  const visibleCurrency0 = currency0 ? unwrappedToken(currency0) : undefined
  const visibleCurrency1 = currency1 ? unwrappedToken(currency1) : undefined

  /* Some tokens have different symbols in our system */
  const visibleCurrency0Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolEarning.token0.id,
    visibleCurrency0?.symbol || poolEarning.token0.symbol,
  )
  const visibleCurrency1Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolEarning.token1.id,
    visibleCurrency1?.symbol || poolEarning.token1.symbol,
  )

  const poolName = `${visibleCurrency0Symbol} - ${visibleCurrency1Symbol}`

  const toggleExpanded: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    e => {
      mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_POOL_EXPAND, {
        pool_name: poolName,
        pool_address: poolEarning.id,
      })

      e.stopPropagation()
      setExpanded(e => !e)
    },
    [mixpanelHandler, poolEarning.id, poolName],
  )

  const here = (
    <Link to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=elastic&type=active&search=${poolEarning.id}`}>
      <Trans>here</Trans>
    </Link>
  )

  const isFarmingPool = poolEarning.farmApr && poolEarning.farmApr !== '0'

  const poolEarningToday = useMemo(() => {
    const earning = poolEarning.historicalEarning[0]?.total?.reduce(
      (acc, tokenEarning) => acc + Number(tokenEarning.amountUSD),
      0,
    )

    return earning || 0
  }, [poolEarning.historicalEarning])

  const poolEarningStr = formatUSDValue(poolEarningToday)

  const feePercent = (Number(poolEarning.feeTier) * 100) / ELASTIC_BASE_FEE_UNIT + '%'

  const analyticUrl = PROMM_ANALYTICS_URL[chainId] + '/pool/' + poolEarning.id

  useEffect(() => {
    setExpanded(shouldExpandAllPools)
  }, [shouldExpandAllPools])

  const renderStatsRow = () => {
    return (
      <StatsRow
        currency0={visibleCurrency0}
        currency1={visibleCurrency1}
        feeAmount={feeAmount}
        chainId={chainId}
        totalValueLockedUsd={poolEarning.totalValueLockedUsd}
        poolAPR={Number(poolEarning.apr || 0)}
        farmAPR={Number(poolEarning.farmApr || 0)}
        volume24hUsd={Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo)}
        fees24hUsd={Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo)}
        poolAddress={poolEarning.id}
        analyticUrl={analyticUrl}
        renderToggleExpandButton={() => {
          return (
            <ButtonIcon
              style={{
                flex: '0 0 36px',
                width: '36px',
                height: '36px',
                transform: isExpanded ? 'rotate(180deg)' : undefined,
                transition: 'all 150ms ease',
              }}
              disabled={!pool || poolState === PoolState.LOADING}
              onClick={toggleExpanded}
            >
              {poolState === PoolState.LOADING ? <Loader /> : <DropdownSVG />}
            </ButtonIcon>
          )
        }}
      />
    )
  }

  const renderSharePoolEarningsButton = () => {
    return (
      <SharePoolEarningsButton
        totalValue={poolEarningToday}
        currency0={visibleCurrency0}
        currency1={visibleCurrency1}
        currency0Symbol={visibleCurrency0Symbol}
        currency1Symbol={visibleCurrency1Symbol}
        feePercent={feePercent}
      />
    )
  }

  if (!visibleCurrency0 || !visibleCurrency1) {
    return null
  }

  const renderPositions = () => {
    return (
      <Positions
        positionEarnings={positionEarnings}
        chainId={chainId}
        pool={pool}
        pendingFees={pendingFees}
        tokenPrices={tokenPrices}
        currency0={visibleCurrency0}
        currency1={visibleCurrency1}
      />
    )
  }

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          padding: '16px',
          background: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: '20px',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Flex
            sx={{
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Flex alignItems={'center'}>
              <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={18} />

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
              >
                {poolName}
              </Text>
            </Flex>

            <Badge $color={theme.blue}>FEE {feePercent}</Badge>

            {isFarmingPool && (
              <MouseoverTooltip
                noArrow
                placement="top"
                text={
                  <Text>
                    <Trans>Available for yield farming. Click {here} to go to the farm.</Trans>
                  </Text>
                }
              >
                <Badge $color={theme.apr}>
                  <MoneyBag size={12} /> V2
                </Badge>
              </MouseoverTooltip>
            )}
          </Flex>
        </Flex>

        {renderStatsRow()}

        {isExpanded && isExpandable && (
          <>
            <Flex
              sx={{
                width: '100%',
                height: 0,
                borderBottom: `1px solid transparent`,
                borderBottomColor: theme.border,
              }}
            />
            <Flex
              sx={{
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '20px',
                  color: theme.subText,
                }}
              >
                <Trans>Total Earnings</Trans>
              </Text>

              <Flex
                alignItems="center"
                sx={{
                  gap: '16px',
                }}
              >
                <Text
                  sx={{
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '28px',
                    color: theme.text,
                  }}
                >
                  {poolEarningStr}
                </Text>

                {renderSharePoolEarningsButton()}
              </Flex>
            </Flex>
            <PoolEarningsSection historicalEarning={poolEarning.historicalEarning} chainId={chainId} />

            <Box
              sx={{
                flex: '0 0 1px',
                alignSelf: 'stretch',
                width: '100%',
                borderBottom: '1px solid transparent',
                borderBottomColor: theme.border,
              }}
            />

            {renderPositions()}
          </>
        )}
      </Flex>
    )
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        padding: '24px',
        background: theme.background,
        border: `1px solid ${theme.border}`,
        borderRadius: '20px',
      }}
    >
      <Flex
        sx={{
          width: '100%',
          flexDirection: 'column',
          gap: '24px',
          cursor: 'pointer',
        }}
        onClick={() => {
          if (!isExpandable) {
            return
          }

          setExpanded(e => !e)
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Flex
            sx={{
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Flex alignItems={'center'}>
              <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={20} />

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24px',
                }}
              >
                {poolName}
              </Text>
            </Flex>

            <Badge $color={theme.blue}>FEE {feePercent}</Badge>

            {isFarmingPool && (
              <MouseoverTooltip
                noArrow
                placement="top"
                text={
                  <Text>
                    <Trans>Available for yield farming. Click {here} to go to the farm.</Trans>
                  </Text>
                }
              >
                <Badge $color={theme.apr}>
                  <MoneyBag size={16} /> Farm
                </Badge>
              </MouseoverTooltip>
            )}
          </Flex>

          <Flex
            sx={{
              alignItems: 'center',
              color: theme.subText,
              fontSize: '14px',
              gap: '4px',
            }}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <CopyHelper toCopy={poolEarning.id} text={shortenAddress(chainId, poolEarning.id, 4)} />
          </Flex>
        </Flex>

        {renderStatsRow()}
      </Flex>

      {isExpanded && isExpandable && (
        <>
          <Flex
            sx={{
              width: '100%',
              height: 0,
              borderBottom: `1px solid transparent`,
              borderBottomColor: theme.border,
            }}
          />
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Text
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '20px',
                color: theme.text,
              }}
            >
              <Trans>Total Earnings</Trans>
            </Text>

            <Flex
              alignItems="center"
              sx={{
                gap: '16px',
              }}
            >
              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '24px',
                  lineHeight: '28px',
                  color: theme.text,
                }}
              >
                {poolEarningStr}
              </Text>

              {renderSharePoolEarningsButton()}
            </Flex>
          </Flex>
          <PoolEarningsSection historicalEarning={poolEarning.historicalEarning} chainId={chainId} />
          {renderPositions()}
        </>
      )}
    </Flex>
  )
}

export default SinglePool
