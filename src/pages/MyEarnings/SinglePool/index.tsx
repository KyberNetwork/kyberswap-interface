import { ChainId } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { PoolEarningWithDetails, PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { PoolState } from 'hooks/usePools'
import { usePoolv2 } from 'hooks/usePoolv2'
import useTheme from 'hooks/useTheme'
import Positions from 'pages/MyEarnings/Positions'
import PoolEarningsSection from 'pages/MyEarnings/SinglePool/PoolEarningsSection'
import StatsRow from 'pages/MyEarnings/SinglePool/StatsRow'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { isAddress, shortenAddress } from 'utils'

const Badge = styled.div<{ $color?: string }>`
  height: 32px;

  display: flex;
  align-items: center;
  gap: 4px;

  padding: 0 8px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  border-radius: 16px;

  color: ${({ $color, theme }) => $color || theme.subText};
  background: ${({ $color, theme }) => rgba($color || theme.subText, 0.3)};
`

type Props = {
  chainId: ChainId
  poolEarning: PoolEarningWithDetails
  positionEarnings: PositionEarningWithDetails[]
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, positionEarnings }) => {
  const theme = useTheme()
  const [isExpanded, setExpanded] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

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

  const toggleExpanded = useCallback(() => {
    setExpanded(e => !e)
  }, [])

  const { pool, poolState } = usePoolv2(chainId, currency0, currency1, feeAmount)

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
              {poolEarning.token0.symbol} - {poolEarning.token1.symbol}
            </Text>
          </Flex>

          <Badge $color={theme.blue}>FEE {(Number(poolEarning.feeTier) * 100) / ELASTIC_BASE_FEE_UNIT}%</Badge>

          <Badge $color={theme.apr}>
            <MoneyBag size={16} /> Farm
          </Badge>
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

      <StatsRow
        currency0={currency0}
        currency1={currency1}
        feeAmount={feeAmount}
        chainId={chainId}
        totalValueLockedUsd={poolEarning.totalValueLockedUsd}
        apr={poolEarning.apr}
        volume24hUsd={Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo)}
        fees24hUsd={Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo)}
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
              {poolState === PoolState.LOADING ? <Loader /> : <DropdownSVG />}
            </ButtonIcon>
          )
        }}
      />

      {isExpanded && (
        <>
          <PoolEarningsSection poolEarning={poolEarning} chainId={chainId} />
          <Positions positionEarnings={positionEarnings} chainId={chainId} pool={pool} />
        </>
      )}
    </Flex>
  )
}

export default SinglePool
