import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { BarChart2, MoreHorizontal, Share2 } from 'react-feather'
import { Link, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import styled from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import { TextButtonPrimary } from 'components/Button'
import { OutlineCard } from 'components/Card'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmTag } from 'components/FarmTag'
import AspectRatio from 'components/Icons/AspectRatio'
import CircleInfoIcon from 'components/LiveChart/CircleInfoIcon'
import { Circle } from 'components/Rating'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import usePoolTransactionsStat from 'hooks/usePoolTransactionsStat'
import useTheme from 'hooks/useTheme'
import PriceVisualize from 'pages/Farm/ElasticFarmv2/components/PriceVisualize'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { ElasticPoolDetail } from 'types/pool'
import { isAddressString } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

import { POOL_TRANSACTION_TYPE } from './type'

const COLORS = {
  [POOL_TRANSACTION_TYPE.ADD]: '#31CB9E',
  [POOL_TRANSACTION_TYPE.REMOVE]: '#FF537B',
}

const StyledLink = styled(ExternalLink)`
  :hover {
    text-decoration: none;
  }
`

interface ListItemProps {
  pool: ElasticPoolDetail
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
  onClickPoolAnalytics?: () => void
  onFarmRangeSelected: (tickLower: number, tickUpper: number) => void
}

const getPrommAnalyticLink = (chainId: ChainId, poolAddress: string) => {
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

const Wrapper = styled.div`
  perspective: 1200px;
`
const WrapperInner = styled.div`
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  border-radius: 20px;
  padding: 16px;
  background-image: url(${bgimg});
  background-size: cover;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.buttonBlack};

  &.rotate {
    transform: rotateY(180deg);
  }

  position: relative;
`

const FrontFace = styled.div`
  backface-visibility: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -1;
`
const BackFace = styled(FrontFace)`
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(180deg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
`

export default function ProAmmPoolStat({
  pool,
  onShared,
  userPositions,
  onClickPoolAnalytics,
  onFarmRangeSelected,
}: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const allTokens = useAllTokens()
  const { farms } = useElasticFarms()
  const { farms: farmsV2 } = useElasticFarmsV2()
  const activeFarmV2s = useMemo(
    () => farmsV2?.filter(farm => farm.endTime > Date.now() / 1000 && !farm.isSettled),
    [farmsV2],
  )

  const token0 =
    allTokens[isAddressString(chainId, pool.token0.address)] ||
    new Token(chainId, pool.token0.address, pool.token0.decimals, pool.token0.symbol)
  const token1 =
    allTokens[isAddressString(chainId, pool.token1.address)] ||
    new Token(chainId, pool.token1.address, pool.token1.decimals, pool.token1.symbol)

  const nativeToken = NativeCurrencies[chainId]

  const isToken0WETH = token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const token0Slug = isToken0WETH ? nativeToken.symbol : token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : token1.symbol

  const myLiquidity = userPositions[pool.address]

  const isFarmingPool: boolean = useMemo(() => {
    let fairlaunchAddress = ''
    let pid = -1

    farms?.forEach(farm => {
      const p = farm.pools
        .filter(item => item.endTime > Date.now() / 1000)
        .find(item => item.poolAddress.toLowerCase() === pool.address.toLowerCase())

      if (p) {
        fairlaunchAddress = farm.id
        pid = Number(p.pid)
      }
    })

    return !!fairlaunchAddress && pid !== -1
  }, [farms, pool.address])

  const farmV2 = useMemo(
    () => activeFarmV2s?.find(item => item.poolAddress.toLowerCase() === pool.address.toLowerCase()),
    [activeFarmV2s, pool.address],
  )
  const isFarmV2 = !!farmV2

  const ranges = useMemo(() => farmV2?.ranges || [], [farmV2])

  const poolTransactionsStat = usePoolTransactionsStat(pool.address)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const isDarkMode = useIsDarkMode()
  const [searchParams] = useSearchParams()
  const [activeRange, setActiveRange] = useState(Number(searchParams.get('farmRange') || '0'))

  useEffect(() => {
    if (ranges?.[activeRange]) {
      onFarmRangeSelected(ranges[activeRange].tickLower, ranges[activeRange].tickUpper)
    }
    // Only run once
    // eslint-disable-next-line
  }, [])

  const farmAPR = isFarmV2 ? ranges[activeRange]?.apr : pool.farmAPR

  const APR = (
    <>
      <Text
        marginTop={isFarmV2 ? '0' : '1rem'}
        width="fit-content"
        lineHeight="16px"
        fontSize="12px"
        fontWeight="500"
        color={theme.subText}
        sx={{ borderBottom: `1px dashed ${theme.border}` }}
      >
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={
            <APRTooltipContent farmV2APR={ranges[activeRange]?.apr} farmAPR={pool.farmAPR || 0} poolAPR={pool.apr} />
          }
        >
          <Trans>Avg APR</Trans>
        </MouseoverTooltip>
      </Text>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="28px" fontWeight="500" color={theme.apr}>
          {((farmAPR || 0) + pool.apr).toFixed(2)}%
        </Text>

        {!!farmV2 ? (
          <PriceVisualize
            tickCurrent={pool.tick}
            tickRangeLower={ranges[activeRange]?.tickLower}
            tickRangeUpper={ranges[activeRange]?.tickUpper}
            token0={farmV2.token0}
            token1={farmV2.token1}
          />
        ) : (
          isFarmingPool && <FarmTag version="v1" address={pool.address} />
        )}
      </Flex>
    </>
  )

  const volumeAndFee = (
    <>
      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
        <Text>
          <Trans>Volume (24H)</Trans>
        </Text>
        <Text>
          <Trans>Fees (24H)</Trans>
        </Text>
      </Flex>

      <Flex
        justifyContent="space-between"
        fontSize="16px"
        fontWeight="500"
        marginTop="0.25rem"
        marginBottom={isFarmV2 ? '0' : '1rem'}
      >
        <Text>{formatDollarAmount(pool.volumeUSDLast24h)}</Text>
        <Text>{formatDollarAmount(pool.volumeUSDLast24h * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}</Text>
      </Flex>
    </>
  )

  const header = (
    <Flex alignItems="center" justifyContent="space-between">
      <Link
        to={`${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`}
        style={{
          textDecoration: 'none',
        }}
      >
        <Flex alignItems="center">
          <DoubleCurrencyLogo
            size={20}
            currency0={isToken0WETH ? nativeToken : token0}
            currency1={isToken1WETH ? nativeToken : token1}
          />
          <Text fontSize={16} fontWeight="500">
            {token0Symbol} - {token1Symbol}
          </Text>
          <FeeTag style={{ fontSize: '12px', marginRight: '4px' }}>
            Fee {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
          </FeeTag>
        </Flex>
      </Link>
      <Flex alignItems="center" sx={{ gap: '6px' }} color={theme.subText}>
        <CopyHelper toCopy={pool.address} />

        <MouseoverTooltip
          width="fit-content"
          placement="bottom"
          text={
            <div>
              <Flex
                sx={{ gap: '4px', cursor: 'pointer' }}
                role="button"
                alignItems="center"
                marginBottom="0.5rem"
                color={theme.subText}
                onClick={() => {
                  onShared(pool.address)
                }}
              >
                <Share2 size="14px" color={theme.subText} />
                <Trans>Share</Trans>
              </Flex>

              <StyledLink href={getPrommAnalyticLink(chainId, pool.address)} onClick={onClickPoolAnalytics}>
                <Flex alignItems="center">
                  <BarChart2 size="16px" color={theme.subText} />
                  <Text fontSize="12px" fontWeight="500" marginLeft="4px" color={theme.subText}>
                    Pool Analytics ↗
                  </Text>
                </Flex>
              </StyledLink>
            </div>
          }
        >
          <MoreHorizontal size={16} />
        </MouseoverTooltip>
      </Flex>
    </Flex>
  )

  const [showRange, setShowRange] = useState(false)

  return (
    <Wrapper key={pool.address}>
      <WrapperInner className={showRange ? 'rotate' : ''}>
        <FrontFace>
          {header}

          {isFarmV2 ? (
            <>
              <OutlineCard marginTop="1rem" padding="0.7rem">
                {APR}

                <Flex
                  justifyContent="space-between"
                  color={theme.subText}
                  fontSize="12px"
                  fontWeight="500"
                  marginTop="1rem"
                >
                  <Text>Staked TVL</Text>
                  <Text>My Deposit</Text>
                </Flex>

                <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
                  {/*
                      <Text>{ranges[activeRange]?.tvl ? formatDollarAmount(ranges[activeRange].tvl) : '--'}</Text>
                  */}
                  <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
                </Flex>
              </OutlineCard>

              <Flex justifyContent="center" margin="0.5rem 0">
                <TextButtonPrimary
                  disabled={ranges?.length === 0}
                  fontSize="12px"
                  onClick={() => {
                    setShowRange(true)
                  }}
                >
                  <AspectRatio size={16} />
                  <Trans>{ranges.filter(item => !item.isRemoved)?.length || 0} Range(s) Available</Trans>
                </TextButtonPrimary>
              </Flex>
            </>
          ) : (
            <>
              {APR}
              {volumeAndFee}
            </>
          )}

          <Divider />

          {isFarmV2 ? (
            volumeAndFee
          ) : (
            <>
              <Flex
                justifyContent="space-between"
                color={theme.subText}
                fontSize="12px"
                fontWeight="500"
                marginTop="1rem"
              >
                <Text>TVL</Text>
                <Text>My Liquidity</Text>
              </Flex>

              <Flex
                justifyContent="space-between"
                fontSize="16px"
                fontWeight="500"
                marginTop="0.25rem"
                marginBottom="1rem"
              >
                <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
                <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
              </Flex>
            </>
          )}

          {poolTransactionsStat !== undefined && (
            <Flex marginTop="20px" sx={{ gap: '16px' }} flexDirection="column">
              <Text color={theme.subText} fontSize="12px" fontWeight="500">
                <Trans>Last 24H Transactions</Trans>
              </Text>
              <Flex sx={{ width: '100%', height: '88px' }} alignItems="center">
                {poolTransactionsStat === 0 ? (
                  <Flex
                    sx={{ width: '100%', gap: '16px', color: theme.subText }}
                    justifyContent="center"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <CircleInfoIcon size="32" />

                    <Text
                      as={Flex}
                      wrap="unwrap"
                      fontSize="12px"
                      fontWeight={500}
                      color={theme.subText}
                      alignItems="center"
                      flexDirection="column"
                    >
                      <Trans>No add / remove transactions in the last 24 hrs</Trans>
                    </Text>
                  </Flex>
                ) : (
                  <Flex sx={{ gap: upToLarge ? '16px' : '32px', paddingLeft: upToLarge ? '0' : '24px', width: '100%' }}>
                    <PieChart width={88} height={88}>
                      <Pie
                        stroke={isDarkMode ? 'black' : 'white'}
                        data={poolTransactionsStat}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={40}
                        fill="#82ca9d"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {poolTransactionsStat.map((data, index) => (
                          <Cell key={index} fill={COLORS[data.type]} />
                        ))}
                        <Tooltip />
                      </Pie>
                    </PieChart>
                    <Flex sx={{ gap: '12px' }} flexDirection="column" alignSelf="center">
                      {poolTransactionsStat.map(data => (
                        <Flex sx={{ gap: '4px' }} key={data.type}>
                          <Circle color={COLORS[data.type]} size={12} />
                          <Text wrap="unwrap" fontSize="12px" fontWeight={500}>
                            {data.name}{' '}
                            <Text as="span" color={theme.subText}>
                              ({data.percent.toFixed(0)}%)
                            </Text>
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Flex>
          )}
        </FrontFace>
        <BackFace>
          <div style={{ flex: 1, overflow: 'scroll' }}>
            {header}

            {/* <Column gap="12px" style={{ marginTop: '1rem' }}> */}
            {/*   {farmV2 && */}
            {/*     ranges?.map((range, index) => */}
            {/*       range.isRemoved ? null : ( */}
            {/*         <RangeItem */}
            {/*           farmId={farmV2.fId} */}
            {/*           token0={farmV2.token0} */}
            {/*           token1={farmV2.token1} */}
            {/*           active={activeRange === index} */}
            {/*           key={range.id} */}
            {/*           onRangeClick={() => { */}
            {/*             setActiveRange(index) */}
            {/*             onFarmRangeSelected(ranges[index].tickLower, ranges[index].tickUpper) */}
            {/*           }} */}
            {/*           rangeInfo={range} */}
            {/*         /> */}
            {/*       ), */}
            {/*     )} */}
            {/* </Column> */}
          </div>
          <TextButtonPrimary onClick={() => setShowRange(false)} margin="0.5rem auto 0">
            <Trans>Choose this range</Trans>
          </TextButtonPrimary>
        </BackFace>
      </WrapperInner>
    </Wrapper>
  )
}
