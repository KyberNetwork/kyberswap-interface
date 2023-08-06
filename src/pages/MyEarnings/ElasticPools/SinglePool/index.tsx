import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart2, Info, Plus } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ElasticPoolEarningWithDetails, ElasticPositionEarningWithDetails } from 'services/earning/types'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonLight } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmTag } from 'components/FarmTag'
import Loader from 'components/Loader'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import Positions from 'pages/MyEarnings/Positions'
import { WIDTHS } from 'pages/MyEarnings/constants'
import { Badge, DownIcon, MobileStat, MobileStatWrapper, Row, Wrapper } from 'pages/MyEarnings/styled'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { isAddress, shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

export type Props = {
  chainId: ChainId
  poolEarning: ElasticPoolEarningWithDetails
  positionEarnings: ElasticPositionEarningWithDetails[]
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
}

export const StatItem = ({ label, value }: { label: ReactNode | string; value: ReactNode | string }) => {
  const theme = useTheme()
  return (
    <Flex flexDirection="column" sx={{ gap: '6px' }}>
      <Text fontSize={12} color={theme.subText} fontWeight="500" sx={{ textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text fontWeight="500" fontSize={16}>
        {value}
      </Text>
    </Flex>
  )
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, positionEarnings, pendingFees, tokenPrices }) => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const [isExpanded, setExpanded] = useState(false)
  const tabletView = useMedia(`(max-width: ${WIDTHS[3]}px)`)
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)

  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)

  const feeAmount = Number(poolEarning.feeTier) as FeeAmount

  const [currency0, currency1] = useMemo(() => {
    const tokenAddress0 = isAddress(chainId, poolEarning.token0.id)
    const tokenAddress1 = isAddress(chainId, poolEarning.token1.id)

    if (!tokenAddress0 || !tokenAddress1) {
      return []
    }

    const currency0 = new Token(
      chainId,
      poolEarning.token0.id,
      +poolEarning.token0.decimals,
      poolEarning.token0.symbol,
      poolEarning.token0.name,
    )
    const currency1 = new Token(
      chainId,
      poolEarning.token1.id,
      +poolEarning.token1.decimals,
      poolEarning.token1.symbol,
      poolEarning.token1.name,
    )

    return [currency0, currency1]
  }, [chainId, poolEarning])

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

  const isLegacyPool = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

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

  const share = (
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
  )

  const positions = (
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
  )

  const currency0Slug = visibleCurrency0?.isNative ? visibleCurrency0.symbol : visibleCurrency0?.wrapped.address || ''
  const currency1Slug = visibleCurrency1?.isNative ? visibleCurrency1.symbol : visibleCurrency1?.wrapped.address || ''

  if (tabletView) {
    return (
      <Box
        sx={{
          border: mobileView ? undefined : `1px solid ${theme.border}`,
          borderBottom: mobileView ? `1px solid ${theme.border}` : undefined,
          borderRadius: mobileView ? 0 : '1rem',
        }}
      >
        <MobileStatWrapper padding={mobileView ? '1rem 0' : '1rem'}>
          <Flex
            alignItems={mobileView ? 'flex-start' : 'center'}
            justifyContent="space-between"
            flexDirection={mobileView ? 'column' : 'row'}
            sx={{ gap: '0.5rem' }}
          >
            <Flex alignItems="center" sx={{ gap: '0.25rem' }}>
              <Box sx={{ position: 'relative' }}>
                <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={18} />
                <img
                  src={NETWORKS_INFO[chainId].icon}
                  alt={NETWORKS_INFO[chainId].name}
                  width={12}
                  height={12}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    zIndex: 1,
                  }}
                />
              </Box>
              <Text fontSize={16} fontWeight="500">
                {poolName}
              </Text>
              <Badge $color={theme.blue}>FEE {feePercent}</Badge>
              {isFarmingPool && <FarmTag noText address={poolEarning.id} chainId={chainId} />}
            </Flex>
            {share}
          </Flex>

          <MobileStat mobileView={mobileView}>
            <StatItem label="TVL" value={formatDollarAmount(+poolEarning.totalValueLockedUsd)} />
            <StatItem
              label={
                <MouseoverTooltip
                  text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm`}
                >
                  <TextDashed>APR</TextDashed>
                </MouseoverTooltip>
              }
              value={
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
              }
            />
            <StatItem
              label={t`Volume (24h)`}
              value={formatDollarAmount(Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo))}
            />
            <StatItem
              label={t`Fees (24h)`}
              value={formatDollarAmount(Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo))}
            />
            <StatItem label={t`My Liquidity`} value={formatDollarAmount(myLiquidityUsd)} />
            <StatItem label={t`My Earnings`} value={formatDollarAmount(poolEarningToday)} />
          </MobileStat>

          <Flex justifyContent="space-between" alignItems="center">
            {isLegacyPool ? (
              <ButtonLight width="fit-content" height="36px" disabled>
                + <Trans>Add Liquidity</Trans>
              </ButtonLight>
            ) : (
              <ButtonLight
                width="fit-content"
                height="36px"
                as={Link}
                onClick={e => {
                  e.stopPropagation()
                }}
                to={
                  currency0Slug && currency1Slug
                    ? `/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${feeAmount}`
                    : '#'
                }
              >
                + <Trans>Add Liquidity</Trans>
              </ButtonLight>
            )}

            <Flex sx={{ gap: '0.75rem' }}>
              <ButtonIcon
                style={{
                  width: '36px',
                  height: '36px',
                }}
                as="a"
                href={analyticUrl}
                target="_blank"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <BarChart2 color={theme.subText} />
              </ButtonIcon>

              <ButtonIcon
                style={{
                  width: '36px',
                  height: '36px',
                  transform: isExpanded ? 'rotate(-180deg)' : undefined,
                  transition: 'transform 150ms ease',
                }}
                disabled={!pool}
                onClick={toggleExpanded}
              >
                {!pool ? <Loader /> : <DropdownSVG />}
              </ButtonIcon>
            </Flex>
          </Flex>
        </MobileStatWrapper>
        {isExpanded && mobileView && <Divider />}
        {isExpanded && isExpandable && positions}
      </Box>
    )
  }

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
              {isFarmingPool && <FarmTag noText address={poolEarning.id} chainId={chainId} />}
            </Flex>

            {share}
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

          {isLegacyPool ? (
            <ButtonIcon disabled>
              <Plus color={theme.subText} size={18} />
            </ButtonIcon>
          ) : (
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
          )}
        </Flex>
      </Row>
      {isExpanded && isExpandable && positions}
    </Wrapper>
  )
}

export default SinglePool
