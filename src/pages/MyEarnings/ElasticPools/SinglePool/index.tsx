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
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { PoolState } from 'hooks/usePools'
import { usePoolv2 } from 'hooks/usePoolv2'
import useTheme from 'hooks/useTheme'
import PoolEarningsSection from 'pages/MyEarnings/ElasticPools/SinglePool/PoolEarningsSection'
import SharePoolEarningsButton from 'pages/MyEarnings/ElasticPools/SinglePool/SharePoolEarningsButton'
import StatsRow from 'pages/MyEarnings/ElasticPools/SinglePool/StatsRow'
import Positions from 'pages/MyEarnings/Positions'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress, shortenAddress } from 'utils'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'

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

export type Props = {
  chainId: ChainId
  poolEarning: ElasticPoolEarningWithDetails
  positionEarnings: ElasticPositionEarningWithDetails[]
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, positionEarnings, pendingFees, tokenPrices }) => {
  const theme = useTheme()
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

  /* Some tokens have different symbols in our system */
  const displaySymbolOfToken0 = getTokenSymbolWithHardcode(chainId, poolEarning.token0.id, poolEarning.token0.symbol)
  const displaySymbolOfToken1 = getTokenSymbolWithHardcode(chainId, poolEarning.token1.id, poolEarning.token1.symbol)

  const toggleExpanded = useCallback(() => {
    setExpanded(e => !e)
  }, [])

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

  const poolEarningStr = formatValue(poolEarningToday)

  const feePercent = (Number(poolEarning.feeTier) * 100) / ELASTIC_BASE_FEE_UNIT + '%'

  const analyticUrl = PROMM_ANALYTICS_URL[chainId] + '/pool/' + poolEarning.id

  useEffect(() => {
    setExpanded(shouldExpandAllPools)
  }, [shouldExpandAllPools])

  const renderStatsRow = () => {
    return (
      <StatsRow
        currency0={currency0}
        currency1={currency1}
        feeAmount={feeAmount}
        chainId={chainId}
        totalValueLockedUsd={poolEarning.totalValueLockedUsd}
        apr={poolEarning.apr}
        volume24hUsd={Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo)}
        fees24hUsd={Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo)}
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
                {poolEarning.token0.symbol} - {poolEarning.token1.symbol}
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
            <PoolEarningsSection poolEarning={poolEarning} chainId={chainId} />

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
              positionEarnings={positionEarnings}
              chainId={chainId}
              pool={pool}
              pendingFees={pendingFees}
              tokenPrices={tokenPrices}
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
          <CopyHelper toCopy={poolEarning.id} />
          <Text>{shortenAddress(chainId, poolEarning.id, 4)}</Text>
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
          <PoolEarningsSection poolEarning={poolEarning} chainId={chainId} />
          <Positions
            positionEarnings={positionEarnings}
            chainId={chainId}
            pool={pool}
            pendingFees={pendingFees}
            tokenPrices={tokenPrices}
          />
        </>
      )}
    </Flex>
  )
}

export default SinglePool
