import { FeeAmount, Position } from '@vutien/dmm-v3-sdk'
import Copy from 'components/Copy'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import React from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'
import { BigNumber } from 'ethers'
import RangeBadge from 'components/Badge/RangeBadge'
import { unwrappedToken } from 'utils/wrappedCurrency'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'

export default function ProAmmPoolInfo({ position }: { position: Position }) {
  const theme = useTheme()
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange = position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent > position.tickUpper

  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)
  return (
    <>
      {poolAddress && (
        <Flex justifyContent="space-between" alignItems="center">
          <Flex alignItems="center">
            <DoubleCurrencyLogo currency0={token0Shown} currency1={token1Shown} size={40} />
            <AutoColumn>
              <Text fontSize="20px" fontWeight="500">
                {token0Shown.symbol} - {token1Shown.symbol}
              </Text>
              <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                {position?.pool.fee / 100}% | {poolAddress && shortenAddress(poolAddress)}{' '}
                {poolAddress && (
                  <span style={{ display: 'inline-block' }}>
                    <Copy toCopy={poolAddress}></Copy>
                  </span>
                )}
              </Text>
            </AutoColumn>
          </Flex>

          <RangeBadge removed={removed} inRange={!outOfRange} />
        </Flex>
      )}
    </>
  )
}
