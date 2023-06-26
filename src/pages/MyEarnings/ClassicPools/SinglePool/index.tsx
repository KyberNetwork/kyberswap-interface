import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ClassicPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import Position from 'pages/MyEarnings/ClassicPools/SinglePool/Position'
import PoolEarningsSection from 'pages/MyEarnings/ElasticPools/SinglePool/PoolEarningsSection'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import { ClassicPoolData } from 'pages/MyEarnings/hooks'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { TokenAddressMap } from 'state/lists/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress, shortenAddress } from 'utils'
import { getTradingFeeAPR } from 'utils/dmm'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'

import StatsRow from './StatsRow'

const calculateAmpLiquidity = (rawAmp: string, reserveUSD: string) => {
  const amp = new Fraction(rawAmp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const ampLiquidity = parseFloat(amp.toSignificant(5)) * parseFloat(reserveUSD)
  return ampLiquidity
}

const formatValue = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
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
  poolData: ClassicPoolData
  userLiquidity: UserLiquidityPosition | undefined
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, poolData, userLiquidity }) => {
  const theme = useTheme()
  const [isExpanded, setExpanded] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)

  const currency0 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolData.token0.id)
  const currency1 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolData.token1.id)

  const hasLiquidity = userLiquidity && userLiquidity.liquidityTokenBalance !== '0'

  /* Some tokens have different symbols in our system */
  const displaySymbolOfToken0 = getTokenSymbolWithHardcode(chainId, poolData.token0.id, poolData.token0.symbol)
  const displaySymbolOfToken1 = getTokenSymbolWithHardcode(chainId, poolData.token1.id, poolData.token1.symbol)

  // TODO
  const feeAmount = FeeAmount.STABLE

  const isExpandable = true //!!pool && poolState !== PoolState.LOADING

  const toggleExpanded: React.MouseEventHandler<HTMLButtonElement> = useCallback(e => {
    e.stopPropagation()
    setExpanded(e => !e)
  }, [])

  const here = (
    <Link to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=elastic&type=active&search=${poolEarning.id}`}>
      <Trans>here</Trans>
    </Link>
  )

  // TODO
  const isFarmingPool = false // poolEarning.farmApr && poolEarning.farmApr !== '0'

  const poolEarningToday = useMemo(() => {
    const earning = poolEarning.historicalEarning[0]?.total?.reduce(
      (acc, tokenEarning) => acc + Number(tokenEarning.amountUSD),
      0,
    )

    return earning || 0
  }, [poolEarning.historicalEarning])

  const poolEarningStr = formatValue(poolEarningToday)

  useEffect(() => {
    setExpanded(shouldExpandAllPools)
  }, [shouldExpandAllPools])

  const tvl = Number(poolData.reserveUSD)
  const feePercent = (Number(feeAmount) * 100) / ELASTIC_BASE_FEE_UNIT + '%'
  const ampLiquidity = calculateAmpLiquidity(poolData.amp, poolData.reserveUSD)

  const fee24H = poolData.oneDayFeeUSD ? poolData.oneDayFeeUSD : poolData.oneDayFeeUntracked
  const poolApr = getTradingFeeAPR(poolData.reserveUSD, fee24H).toFixed(2)

  const renderStatsRow = () => {
    return (
      <StatsRow
        currency0={currency0}
        currency1={currency1}
        feeAmount={feeAmount}
        chainId={chainId}
        totalValueLockedUsd={tvl}
        poolApr={poolApr}
        farmApr={'--'}
        ampLiquidity={ampLiquidity}
        volume24hUsd={Number(poolData.oneDayVolumeUSD)}
        fees24hUsd={Number(poolData.oneDayFeeUSD)}
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
              onClick={toggleExpanded}
            >
              {1 + 1 === 1 + 2 ? <Loader /> : <DropdownSVG />}
            </ButtonIcon>
          )
        }}
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
            <Flex
              alignItems={'center'}
              sx={{
                gap: '4px',
              }}
            >
              <Flex alignItems={'center'}>
                <Logo srcs={[currency0?.logoURI || '']} style={{ width: 20, height: 20, borderRadius: '999px' }} />
                <Logo srcs={[currency1?.logoURI || '']} style={{ width: 20, height: 20, borderRadius: '999px' }} />
              </Flex>

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
              >
                TOKEN - TOKEN {/* TODO {poolEarning.token0.symbol} - {poolEarning.token1.symbol} */}
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

                {/* TODO */}
                {/* <SharePoolEarningsButton
                  totalValue={poolEarningToday}
                  currency0={currency0}
                  currency1={currency1}
                  feePercent={feePercent}
                /> */}
              </Flex>
            </Flex>

            <Box
              sx={{
                flex: '0 0 1px',
                alignSelf: 'stretch',
                width: '100%',
                borderBottom: '1px solid transparent',
                borderBottomColor: theme.border,
              }}
            />
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
      onClick={() => {
        console.log({ poolData })
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
            <Flex
              alignItems={'center'}
              sx={{
                gap: '4px',
              }}
            >
              <Flex alignItems={'center'}>
                <Logo srcs={[currency0?.logoURI || '']} style={{ width: 24, height: 24, borderRadius: '999px' }} />
                <Logo srcs={[currency1?.logoURI || '']} style={{ width: 24, height: 24, borderRadius: '999px' }} />
              </Flex>

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24px',
                }}
              >
                {displaySymbolOfToken0} - {displaySymbolOfToken1}
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
          >
            <CopyHelper toCopy={poolEarning.pool.id} />
            <Text>{shortenAddress(chainId, poolEarning.pool.id, 4)}</Text>
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

              <SharePoolEarningsButton
                totalValue={poolEarningToday}
                token0={
                  currency0?.logoURI && displaySymbolOfToken0
                    ? {
                        logoURI: currency0?.logoURI,
                        symbol: displaySymbolOfToken0,
                      }
                    : undefined
                }
                token1={
                  currency1?.logoURI && displaySymbolOfToken1
                    ? {
                        logoURI: currency1?.logoURI,
                        symbol: displaySymbolOfToken1,
                      }
                    : undefined
                }
                feePercent={feePercent}
              />
            </Flex>
          </Flex>
          <PoolEarningsSection historicalEarning={poolEarning.historicalEarning} chainId={chainId} />
          <Position
            poolAddress={poolEarning.pool.id}
            currency0={currency0}
            currency1={currency1}
            chainId={chainId}
            userLiquidity={userLiquidity}
          />
        </>
      )}
    </Flex>
  )
}

export default SinglePool
