import { ChainId } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart2, Info, Plus } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ElasticPoolEarningWithDetails, ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmTag } from 'components/FarmTag'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import StatsRow from 'pages/MyEarnings/ElasticPools/SinglePool/StatsRow'
import PoolEarningsSection from 'pages/MyEarnings/PoolEarningsSection'
import Positions from 'pages/MyEarnings/Positions'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress, shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

const DownIcon = styled(DropdownSVG)<{ isOpen: boolean }>`
  transform: rotate(${({ isOpen }) => (!isOpen ? '-90deg' : '0')});
  transition: transform 0.3s;
`

const Wrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};

  :last-child {
    border-bottom: none;
  }
`

const Row = styled.div`
  align-items: center;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  display: grid;
  grid-template-columns: 3fr repeat(7, 1fr);
`

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
  const [isExpanded, setExpanded] = useState(true)
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

  const pool = useMemo(() => {
    if (currency0 && currency1)
      return new Pool(
        currency0.wrapped,
        currency1.wrapped,
        feeAmount,
        poolEarning.sqrtPrice,
        poolEarning.liquidity,
        poolEarning.reinvestL,
        +poolEarning.tick,
      )
    return undefined
  }, [currency0, currency1, feeAmount, poolEarning])

  const isExpandable = !!pool

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

  const isFarmingPool = poolEarning.farmApr && poolEarning.farmApr !== '0'

  const poolEarningToday = useMemo(() => {
    const earning = poolEarning.historicalEarning[0]?.total?.reduce(
      (acc, tokenEarning) => acc + Number(tokenEarning.amountUSD),
      0,
    )

    return earning || 0
  }, [poolEarning.historicalEarning])

  const feePercent = (Number(poolEarning.feeTier) * 100) / ELASTIC_BASE_FEE_UNIT + '%'

  const analyticUrl = PROMM_ANALYTICS_URL[chainId] + '/pool/' + poolEarning.id

  useEffect(() => {
    setExpanded(shouldExpandAllPools)
  }, [shouldExpandAllPools])

  const farmAPR = Number(poolEarning.farmApr || 0)
  const poolAPR = Number(poolEarning.apr || 0)

  const myLiquidityUsd = positionEarnings.reduce((total, position) => {
    if (!pool) return total
    const pos = new Position({
      pool,
      liquidity: position.liquidity,
      tickLower: +position.tickLower,
      tickUpper: +position.tickUpper,
    })

    const token0Price = tokenPrices[visibleCurrency0?.wrapped.address || '']
    const token1Price = tokenPrices[visibleCurrency1?.wrapped.address || '']

    const liquidityInUsd =
      parseFloat(pos.amount0.toExact() || '0') * token0Price + parseFloat(pos.amount1.toExact() || '0') * token1Price

    return total + liquidityInUsd
  }, 0)

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
              disabled={!pool}
              onClick={toggleExpanded}
            >
              {!pool ? <Loader /> : <DropdownSVG />}
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
            <Flex alignItems="center">
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

            {isFarmingPool && <FarmTag noText address={poolEarning.id} />}
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
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDollarAmount(poolEarningToday)}
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

            <Positions
              poolEarning={poolEarning}
              positionEarnings={positionEarnings}
              chainId={chainId}
              pool={pool}
              pendingFees={pendingFees}
              tokenPrices={tokenPrices}
              currency0={visibleCurrency0}
              currency1={visibleCurrency1}
            />
          </>
        )}
      </Flex>
    )
  }

  const currency0Slug = visibleCurrency0?.isNative ? visibleCurrency0.symbol : visibleCurrency0?.wrapped.address || ''
  const currency1Slug = visibleCurrency1?.isNative ? visibleCurrency1.symbol : visibleCurrency1?.wrapped.address || ''

  return (
    <Wrapper>
      <Row onClick={() => isExpandable && setExpanded(e => !e)}>
        <Flex alignItems="center">
          <DownIcon isOpen={isExpanded} role="button" />
          <Box sx={{ position: 'relative' }}>
            <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={32} />
            <img
              src={NETWORKS_INFO[chainId].icon}
              alt={NETWORKS_INFO[chainId].name}
              width={18}
              height={18}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                zIndex: 1,
              }}
            />
          </Box>
          <Flex flexDirection="column" sx={{ gap: '4px' }}>
            <Flex
              sx={{
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Text>{poolName}</Text>
              <Badge $color={theme.blue}>FEE {feePercent}</Badge>
              {isFarmingPool && <FarmTag noText address={poolEarning.id} />}
            </Flex>

            <Flex
              sx={{ gap: '8px' }}
              fontSize={12}
              color={theme.subText}
              alignItems="center"
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <CopyHelper toCopy={poolEarning.id} text={shortenAddress(chainId, poolEarning.id, 4)} />
              {renderSharePoolEarningsButton()}
            </Flex>
          </Flex>
        </Flex>
        <Text>{formatDollarAmount(+poolEarning.totalValueLockedUsd)}</Text>

        <MouseoverTooltip
          width="fit-content"
          placement="top"
          text={
            <APRTooltipContent
              farmAPR={farmAPR}
              farmV2APR={
                // TODO
                0
              }
              poolAPR={poolAPR}
            />
          }
        >
          <Text as="span" marginRight="4px" color={theme.apr}>
            {(poolAPR + farmAPR).toFixed(2)}%
          </Text>
          <Info size={14} color={theme.apr} />
        </MouseoverTooltip>

        <Text>{formatDollarAmount(Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo))}</Text>
        <Text>{formatDollarAmount(Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo))}</Text>
        <Text>{formatDollarAmount(myLiquidityUsd)}</Text>
        <Text>{formatDollarAmount(poolEarningToday)}</Text>

        <Flex sx={{ gap: '8px' }} justifyContent="flex-end">
          <ButtonIcon
            style={{
              width: '24px',
              height: '24px',
            }}
            as="a"
            href={analyticUrl}
            target="_blank"
            onClick={e => e.stopPropagation()}
          >
            <BarChart2 color={theme.subText} size={18} />
          </ButtonIcon>

          <ButtonIcon
            color={theme.primary}
            style={{
              width: '24px',
              height: '24px',
            }}
            as={Link}
            to={
              currency0Slug && currency1Slug
                ? `/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${feeAmount}`
                : '#'
            }
            onClick={e => e.stopPropagation()}
          >
            <Plus color={theme.primary} size={18} />
          </ButtonIcon>
        </Flex>
      </Row>

      {isExpanded && isExpandable && (
        <Positions
          poolEarning={poolEarning}
          positionEarnings={positionEarnings}
          chainId={chainId}
          pool={pool}
          pendingFees={pendingFees}
          tokenPrices={tokenPrices}
          currency0={visibleCurrency0}
          currency1={visibleCurrency1}
        />
      )}
    </Wrapper>
  )
}

export default SinglePool
