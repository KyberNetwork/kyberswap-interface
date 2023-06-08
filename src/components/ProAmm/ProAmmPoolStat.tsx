import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { BarChart2, MoreHorizontal, Share2 } from 'react-feather'
import { Link, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import styled from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmTag } from 'components/FarmTag'
import CircleInfoIcon from 'components/LiveChart/CircleInfoIcon'
import { Circle } from 'components/Rating'
import { RowBetween } from 'components/Row'
import Tabs from 'components/Tabs'
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
import { convertTickToPrice } from 'pages/Farm/ElasticFarmv2/utils'
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

const StyledTabs = styled(Tabs)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
`

const Wrapper = styled.div`
  padding: 16px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  background-image: url(${bgimg});
  background-repeat: repeat-y;
  background-size: cover;

  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  background-color: ${({ theme }) => theme.buttonBlack};

  border-radius: 24px;
  font-weight: 500;
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

  const poolTransactionsStat = usePoolTransactionsStat(pool.address)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const isDarkMode = useIsDarkMode()
  const [searchParams] = useSearchParams()
  const [activeRangeIndex, setActiveRangeIndex] = useState(Number(searchParams.get('farmRange') || '0'))

  const range = farmV2?.ranges.find(item => item.index === activeRangeIndex)
  useEffect(() => {
    if (range) {
      onFarmRangeSelected(range.tickLower, range.tickUpper)
    }
    // Only run once
    // eslint-disable-next-line
  }, [])

  const farmAPR = isFarmV2 ? range?.apr : pool.farmAPR

  const APR = (
    <div>
      <Text
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
          text={<APRTooltipContent farmV2APR={range?.apr} farmAPR={pool.farmAPR || 0} poolAPR={pool.apr} />}
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
            tickRangeLower={range?.tickLower}
            tickRangeUpper={range?.tickUpper}
            token0={farmV2.token0.wrapped}
            token1={farmV2.token1.wrapped}
          />
        ) : (
          isFarmingPool && <FarmTag version="v1" address={pool.address} />
        )}
      </Flex>
    </div>
  )

  const volumeAndFee = (
    <div>
      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500">
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
    </div>
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

  return (
    <Wrapper key={pool.address}>
      {header}

      {isFarmV2 ? (
        <>
          <div>
            <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500">
              <Text>Staked TVL</Text>
              <Text>My Deposit</Text>
            </Flex>

            <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
              <Text>{farmV2?.tvl ? formatDollarAmount(farmV2.tvl) : '--'}</Text>
              <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
            </Flex>
          </div>

          <StyledTabs
            activeKey={activeRangeIndex}
            onChange={key => {
              setActiveRangeIndex(+key)
              const r = farmV2?.ranges.find(item => item.index === +key)
              if (r) onFarmRangeSelected(r.tickLower, r.tickUpper)
            }}
            items={farmV2.ranges.map(item => ({
              key: item.index,
              label: (
                <Flex alignItems="center" sx={{ gap: '2px' }}>
                  {convertTickToPrice(farmV2.token0, farmV2.token1, item.tickLower)}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                    <path
                      d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                      fill="currentcolor"
                    />
                  </svg>

                  {convertTickToPrice(farmV2.token0, farmV2.token1, item.tickUpper)}
                </Flex>
              ),
              children: (
                <Flex padding="12px" flexDirection="column">
                  <RowBetween>
                    <MouseoverTooltip text={t`Active Range: Current active farming range`} placement="top">
                      <Text
                        fontSize="12px"
                        color={theme.subText}
                        style={{ borderBottom: `1px dotted ${theme.subText}` }}
                      >
                        APR
                      </Text>
                    </MouseoverTooltip>

                    <MouseoverTooltip
                      text={
                        range?.isRemoved ? (
                          <Trans>
                            This indicates that range is idle. Staked positions in this range is still earning small
                            amount of rewards.
                          </Trans>
                        ) : (
                          ''
                        )
                      }
                    >
                      <Text
                        fontSize="12px"
                        color={range?.isRemoved ? theme.warning : theme.primary}
                        alignSelf="flex-end"
                        sx={{
                          borderBottom: range?.isRemoved ? `1px dotted ${theme.warning}` : undefined,
                        }}
                      >
                        {range?.isRemoved && <Trans>Idle Range</Trans>}
                      </Text>
                    </MouseoverTooltip>
                  </RowBetween>

                  <Text fontSize="28px" marginTop="2px" color={theme.apr}>
                    {(pool.apr + (range?.apr || 0)).toFixed(2)}%
                  </Text>
                </Flex>
              ),
            }))}
          />
        </>
      ) : (
        <>
          {APR}
          {volumeAndFee}
        </>
      )}

      {isFarmV2 ? (
        volumeAndFee
      ) : (
        <div>
          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500">
            <Text>TVL</Text>
            <Text>My Liquidity</Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
            <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
          </Flex>
        </div>
      )}

      <Divider />

      {poolTransactionsStat !== undefined && (
        <Flex sx={{ gap: '16px' }} flexDirection="column">
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
    </Wrapper>
  )
}
