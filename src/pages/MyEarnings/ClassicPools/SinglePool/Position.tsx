import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ClassicPositionEarningWithDetails } from 'services/earning/types'

import CurrencyLogo from 'components/CurrencyLogo'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import PoolEarningsSection from 'pages/MyEarnings/PoolEarningsSection'
import { WIDTHS } from 'pages/MyEarnings/constants'
import { useShowMyEarningChart } from 'state/user/hooks'
import { formattedNum } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

type ColumnProps = {
  label: string
  value: React.ReactNode
}
const Column: React.FC<ColumnProps> = ({ label, value }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '8px',
        fontWeight: 500,
        fontSize: '20px',
        lineHeight: '24px',
        color: theme.text,
      }}
    >
      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
        }}
      >
        {label}
      </Text>

      {value}
    </Flex>
  )
}

type Props = {
  chainId: ChainId
  poolEarning: ClassicPositionEarningWithDetails
}
const Position: React.FC<Props> = ({ poolEarning, chainId }) => {
  const theme = useTheme()
  const [showEarningChart] = useShowMyEarningChart()
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)

  const myLiquidityBalance =
    poolEarning.liquidityTokenBalanceIncludingStake !== '0' && poolEarning.pool.totalSupply !== '0'
      ? formatDollarAmount(
          (+poolEarning.liquidityTokenBalanceIncludingStake * +poolEarning.pool.reserveUSD) /
            +poolEarning.pool.totalSupply,
        )
      : '--'

  const myShareOfPool = +poolEarning.liquidityTokenBalanceIncludingStake / +poolEarning.pool.totalSupply

  const pooledToken0 = +poolEarning.pool.reserve0 * myShareOfPool
  const pooledToken1 = +poolEarning.pool.reserve1 * myShareOfPool

  const token0 = useMemo(
    () =>
      new Token(
        chainId,
        poolEarning.pool.token0.id,
        +poolEarning.pool.token0.decimals,
        poolEarning.pool.token0.symbol,
        poolEarning.pool.token0.name,
      ),
    [chainId, poolEarning],
  )

  const token1 = useMemo(
    () =>
      new Token(
        chainId,
        poolEarning.pool.token1.id,
        +poolEarning.pool.token1.decimals,
        poolEarning.pool.token1.symbol,
        poolEarning.pool.token1.name,
      ),
    [chainId, poolEarning],
  )

  const liquidityStaked = +poolEarning.liquidityTokenBalanceIncludingStake - +poolEarning.liquidityTokenBalance
  const myStakedBalance =
    liquidityStaked !== 0
      ? formatDollarAmount((liquidityStaked * +poolEarning.pool.reserveUSD) / +poolEarning.pool.totalSupply)
      : '--'

  const stakedShare = liquidityStaked / +poolEarning.pool.totalSupply

  const stakedToken0 = +poolEarning.pool.reserve0 * stakedShare
  const stakedToken1 = +poolEarning.pool.reserve1 * stakedShare

  return (
    <Flex
      flexDirection="column"
      backgroundColor={mobileView ? 'transparent' : theme.background}
      padding={mobileView ? '1rem 0' : '1rem'}
      margin={mobileView ? 0 : '0 0.75rem 0.75rem'}
      sx={{ borderRadius: '1rem', gap: '1rem' }}
    >
      <Text fontSize={16} fontWeight="500">
        <Trans>My Liquidity Positions</Trans>
      </Text>

      {showEarningChart && <PoolEarningsSection historicalEarning={poolEarning.historicalEarning} chainId={chainId} />}

      <Box
        sx={{
          width: '100%',
          display: 'flex',

          justifyContent: 'space-between',

          background: theme.buttonBlack,
          borderRadius: '20px',
          padding: '24px',
          gap: '8px',

          ...(mobileView && {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '0',
            gap: '0.75rem',
            '> *:nth-child(2n)': {
              alignItems: 'flex-end',
            },
          }),
        }}
      >
        <Column
          label={t`My Liquidity Balance`}
          value={
            <div>
              <HoverDropdown
                anchor={<span>{myLiquidityBalance}</span>}
                disabled={poolEarning.liquidityTokenBalanceIncludingStake === '0'}
                text={
                  <div>
                    <Flex alignItems="center">
                      <CurrencyLogo currency={unwrappedToken(token0)} size="16px" />
                      <Text fontSize={12} marginLeft="4px">
                        {formattedNum(pooledToken0)} {unwrappedToken(token0).symbol}
                      </Text>
                    </Flex>
                    <Flex alignItems="center" marginTop="8px">
                      <CurrencyLogo currency={unwrappedToken(token1)} size="16px" />
                      <Text fontSize={12} marginLeft="4px">
                        {formattedNum(pooledToken1)} {unwrappedToken(token1).symbol}
                      </Text>
                    </Flex>
                  </div>
                }
              />
            </div>
          }
        />

        <Column
          label={t`My Staked Balance`}
          value={
            <div>
              <HoverDropdown
                anchor={<span>{myStakedBalance}</span>}
                disabled={liquidityStaked === 0}
                text={
                  <div>
                    <Flex alignItems="center">
                      <CurrencyLogo currency={unwrappedToken(token0)} size="16px" />
                      <Text fontSize={12} marginLeft="4px">
                        {formattedNum(stakedToken0)} {unwrappedToken(token0).symbol}
                      </Text>
                    </Flex>
                    <Flex alignItems="center" marginTop="8px">
                      <CurrencyLogo currency={unwrappedToken(token1)} size="16px" />
                      <Text fontSize={12} marginLeft="4px">
                        {formattedNum(stakedToken1)} {unwrappedToken(token1).symbol}
                      </Text>
                    </Flex>
                  </div>
                }
              />
            </div>
          }
        />

        <Column
          label={t`Total LP Tokens`}
          value={
            poolEarning.liquidityTokenBalanceIncludingStake !== '0'
              ? formattedNum(+poolEarning.liquidityTokenBalanceIncludingStake, false, 6)
              : '--'
          }
        />

        <Column
          label={t`Share of Pool`}
          value={myShareOfPool ? (myShareOfPool * 100 < 1 ? '<0.01%' : (myShareOfPool * 100).toFixed(2) + '%') : '--'}
        />

        <Column
          label={t`Staked LP Tokens`}
          value={liquidityStaked !== 0 ? formattedNum(liquidityStaked, false, 6) : '--'}
        />
      </Box>
    </Flex>
  )
}

export default Position
