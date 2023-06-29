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
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import Position from 'pages/MyEarnings/ClassicPools/SinglePool/Position'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import PoolEarningsSection from 'pages/MyEarnings/PoolEarningsSection'
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
import { unwrappedToken } from 'utils/wrappedCurrency'

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

  const { decimals, value: rawBalance } = useTokenBalance(poolEarning.pool.id, chainId)
  const balance = Number(
    new Fraction(rawBalance.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toFixed(8),
  )

  const currency0 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolData.token0.id)
  const currency1 = getCurrencyFromTokenAddress(tokensByChainId, chainId, poolData.token1.id)

  // Need these because we'll display native tokens instead of wrapped tokens
  const visibleCurrency0 = currency0 ? unwrappedToken(currency0) : undefined
  const visibleCurrency1 = currency1 ? unwrappedToken(currency1) : undefined

  /* Some tokens have different symbols in our system */
  const visibleCurrency0Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolData.token0.id,
    visibleCurrency0?.symbol || poolData.token0.symbol,
  )
  const visibleCurrency1Symbol = getTokenSymbolWithHardcode(
    chainId,
    poolData.token1.id,
    visibleCurrency1?.symbol || poolData.token1.symbol,
  )

  const hasLiquidity = userLiquidity && userLiquidity.liquidityTokenBalance !== '0'

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

  const renderShareButton = () => {
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

                {renderShareButton()}
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
              <DoubleCurrencyLogo currency0={visibleCurrency0} currency1={visibleCurrency1} size={24} />

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24px',
                }}
              >
                {visibleCurrency0Symbol} - {visibleCurrency1Symbol}
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

              {renderShareButton()}
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
