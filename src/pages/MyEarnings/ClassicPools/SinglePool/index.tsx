import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { BarChart2, Info, Minus, Plus } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ClassicPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, DMM_ANALYTICS_URL, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import Position from 'pages/MyEarnings/ClassicPools/SinglePool/Position'
import { StatItem } from 'pages/MyEarnings/ElasticPools/SinglePool'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import { WIDTHS } from 'pages/MyEarnings/constants'
import { ClassicRow, DownIcon, MobileStat, MobileStatWrapper, Wrapper } from 'pages/MyEarnings/styled'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { TokenAddressMap } from 'state/lists/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { isAddress, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import { formatDollarAmount } from 'utils/numbers'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

const calculateAmpLiquidity = (rawAmp: string, reserveUSD: string) => {
  const amp = new Fraction(rawAmp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const ampLiquidity = parseFloat(amp.toSignificant(5)) * parseFloat(reserveUSD)
  return ampLiquidity
}

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

const getCurrencyFromTokenAddress = (
  tokensByChainId: TokenAddressMap,
  chainId: ChainId,
  address: string,
): WrappedTokenInfo | undefined => {
  const tokenAddress = isAddress(chainId, address)
  if (!tokenAddress) {
    return undefined
  }

  const currency = tokensByChainId[chainId][tokenAddress]
  return currency
}

export type Props = {
  chainId: ChainId
  poolEarning: ClassicPositionEarningWithDetails
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId }) => {
  const theme = useTheme()
  const networkInfo = NETWORKS_INFO[chainId]
  const [isExpanded, setExpanded] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const tabletView = useMedia(`(max-width: ${WIDTHS[3]}px)`)
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)

  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)
  const currency0 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolEarning.pool.token0.id)
  const currency1 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolEarning.pool.token1.id)

  // Need these because we'll display native tokens instead of wrapped tokens
  const visibleCurrency0 = currency0 ? unwrappedToken(currency0) : undefined
  const visibleCurrency1 = currency1 ? unwrappedToken(currency1) : undefined

  /* Some tokens have different symbols in our system */
  const visibleCurrency0Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolEarning.pool.token0.id,
    visibleCurrency0?.symbol || poolEarning.pool.token0.symbol,
  )
  const visibleCurrency1Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolEarning.pool.token1.id,
    visibleCurrency1?.symbol || poolEarning.pool.token1.symbol,
  )
  const myLiquidityBalance =
    poolEarning.liquidityTokenBalance !== '0' && poolEarning.pool.totalSupply !== '0'
      ? formatDollarAmount(
          (+poolEarning.liquidityTokenBalance * +poolEarning.pool.reserveUSD) / +poolEarning.pool.totalSupply,
        )
      : '--'

  const here = (
    <Link
      to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=classic&type=active&search=${poolEarning.pool.id}`}
    >
      <Trans>here</Trans>
    </Link>
  )

  const isFarmingPool = poolEarning.pool.farmApr !== '0'

  const poolEarningToday = useMemo(() => {
    const earning = poolEarning.historicalEarning[0]?.total?.reduce(
      (acc, tokenEarning) => acc + Number(tokenEarning.amountUSD),
      0,
    )

    return earning || 0
  }, [poolEarning.historicalEarning])

  useEffect(() => {
    setExpanded(shouldExpandAllPools)
  }, [shouldExpandAllPools])

  const amp = +poolEarning.pool.amp / 10_000

  const ampLiquidity = calculateAmpLiquidity(poolEarning.pool.amp, poolEarning.pool.reserveUSD)

  const renderShareButton = () => {
    return (
      <SharePoolEarningsButton
        totalValue={poolEarningToday}
        currency0={visibleCurrency0}
        currency1={visibleCurrency1}
        currency0Symbol={visibleCurrency0Symbol}
        currency1Symbol={visibleCurrency1Symbol}
        amp={amp.toString()}
      />
    )
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
      <CopyHelper toCopy={poolEarning.pool.id} text={shortenAddress(chainId, poolEarning.pool.id, 4)} />
      {renderShareButton()}
    </Flex>
  )

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
                <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={20} />

                <Text
                  sx={{
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '20px',
                  }}
                >
                  {visibleCurrency0Symbol} - {visibleCurrency1Symbol}
                </Text>
              </Flex>

              <Badge $color={theme.blue}>AMP {amp}</Badge>

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
                  <Badge $color={theme.primary} style={{ padding: '4px' }}>
                    <MoneyBag size={12} />
                  </Badge>
                </MouseoverTooltip>
              )}
            </Flex>

            {share}
          </Flex>

          <MobileStat mobileView={mobileView}>
            <StatItem label="TVL" value={formatDollarAmount(+poolEarning.pool.reserveUSD)} />

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
                      farmAPR={+poolEarning.pool.farmApr}
                      farmV2APR={0}
                      poolAPR={+poolEarning.pool.apr}
                    />
                  }
                >
                  <Text as="span" marginRight="4px" color={theme.apr}>
                    {(+poolEarning.pool.apr).toFixed(2)}%
                  </Text>
                  <Info size={14} color={theme.apr} />
                </MouseoverTooltip>
              }
            />
            <StatItem
              label={t`Volume (24h)`}
              value={formatDollarAmount(
                Number(poolEarning.pool.volumeUsd) - Number(poolEarning.pool.volumeUsdOneDayAgo),
              )}
            />
            <StatItem
              label={t`Fees (24h)`}
              value={formatDollarAmount(Number(poolEarning.pool.feeUSD) - Number(poolEarning.pool.feesUsdOneDayAgo))}
            />
            <StatItem label={t`My Liquidity`} value={myLiquidityBalance} />
            <StatItem label={t`My Earnings`} value={formatDollarAmount(poolEarningToday)} />
          </MobileStat>

          <Flex justifyContent="flex-end" alignItems="center" sx={{ gap: '0.75rem' }}>
            <ButtonIcon
              style={{
                width: '36px',
                height: '36px',
              }}
              as="a"
              href={DMM_ANALYTICS_URL[chainId] + '/pool/' + poolEarning.pool.id}
              target="_blank"
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <BarChart2 color={theme.subText} />
            </ButtonIcon>

            {poolEarning.liquidityTokenBalance !== '0' && (
              <ButtonIcon
                color={theme.red}
                style={{
                  width: '36px',
                  height: '36px',
                }}
                as={Link}
                to={`/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyId(
                  visibleCurrency0,
                  chainId,
                )}/${currencyId(visibleCurrency1, chainId)}/${poolEarning.pool.id}`}
                onClick={e => e.stopPropagation()}
              >
                <Minus color={theme.red} size={18} />
              </ButtonIcon>
            )}

            <ButtonIcon
              color={theme.primary}
              style={{
                width: '36px',
                height: '36px',
              }}
              as={Link}
              to={`/${networkInfo.route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(
                visibleCurrency0,
                chainId,
              )}/${currencyId(visibleCurrency1, chainId)}/${poolEarning.pool.id}`}
              onClick={e => e.stopPropagation()}
            >
              <Plus color={theme.primary} size={18} />
            </ButtonIcon>

            <ButtonIcon
              style={{
                width: '36px',
                height: '36px',
                transform: isExpanded ? 'rotate(-180deg)' : undefined,
                transition: 'transform 150ms ease',
              }}
              onClick={() => setExpanded(e => !e)}
            >
              <DropdownSVG />
            </ButtonIcon>
          </Flex>
        </MobileStatWrapper>

        {isExpanded && mobileView && <Divider />}
        {isExpanded && <Position poolEarning={poolEarning} chainId={chainId} />}
      </Box>
    )
  }

  return (
    <>
      <Wrapper>
        <ClassicRow onClick={() => setExpanded(e => !e)}>
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
                <Text>
                  {visibleCurrency0Symbol} - {visibleCurrency1Symbol}
                </Text>
                <Badge $color={theme.blue}>AMP {+poolEarning.pool.amp / 10000}</Badge>

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
                    <Badge $color={theme.primary} style={{ padding: '4px' }}>
                      <MoneyBag size={12} />
                    </Badge>
                  </MouseoverTooltip>
                )}
              </Flex>

              {share}
            </Flex>
          </Flex>

          <div>
            <Text>{formatDollarAmount(ampLiquidity)}</Text>
            <Text color={theme.subText} fontSize={12} marginTop="4px">
              {formatDollarAmount(+poolEarning.pool.reserveUSD)}
            </Text>
          </div>

          <MouseoverTooltip
            width="fit-content"
            placement="top"
            text={
              <APRTooltipContent farmAPR={+poolEarning.pool.farmApr} farmV2APR={0} poolAPR={+poolEarning.pool.apr} />
            }
          >
            <Text as="span" marginRight="4px" color={theme.apr}>
              {(+poolEarning.pool.apr + +poolEarning.pool.farmApr).toFixed(2)}%
            </Text>
            <Info size={14} color={theme.apr} />
          </MouseoverTooltip>

          <Text>
            {formatDollarAmount(Number(poolEarning.pool.volumeUsd) - Number(poolEarning.pool.volumeUsdOneDayAgo))}
          </Text>
          <Text>{formatDollarAmount(Number(poolEarning.pool.feeUSD) - Number(poolEarning.pool.feesUsdOneDayAgo))}</Text>
          <Text>{myLiquidityBalance}</Text>
          <Text>{formatDollarAmount(poolEarningToday)}</Text>

          <Flex sx={{ gap: '8px' }} justifyContent="flex-end">
            <ButtonIcon
              style={{
                width: '24px',
                height: '24px',
              }}
              as="a"
              href={DMM_ANALYTICS_URL[chainId] + '/pool/' + poolEarning.pool.id}
              target="_blank"
              onClick={e => e.stopPropagation()}
            >
              <BarChart2 color={theme.subText} size={18} />
            </ButtonIcon>

            {poolEarning.liquidityTokenBalance !== '0' && (
              <ButtonIcon
                color={theme.red}
                style={{
                  width: '24px',
                  height: '24px',
                }}
                as={Link}
                to={`/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyId(
                  visibleCurrency0,
                  chainId,
                )}/${currencyId(visibleCurrency1, chainId)}/${poolEarning.pool.id}`}
                onClick={e => e.stopPropagation()}
              >
                <Minus color={theme.red} size={18} />
              </ButtonIcon>
            )}

            <ButtonIcon
              color={theme.primary}
              style={{
                width: '24px',
                height: '24px',
              }}
              as={Link}
              to={`/${networkInfo.route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(
                visibleCurrency0,
                chainId,
              )}/${currencyId(visibleCurrency1, chainId)}/${poolEarning.pool.id}`}
              onClick={e => e.stopPropagation()}
            >
              <Plus color={theme.primary} size={18} />
            </ButtonIcon>
          </Flex>
        </ClassicRow>
        {isExpanded && <Position poolEarning={poolEarning} chainId={chainId} />}
      </Wrapper>
    </>
  )
}

export default SinglePool
