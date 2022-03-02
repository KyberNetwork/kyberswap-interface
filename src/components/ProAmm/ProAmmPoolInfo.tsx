import { FeeAmount, Position } from '@vutien/dmm-v3-sdk'
import Copy from 'components/Copy'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { PRO_AMM_CORE_FACTORY_ADDRESSES, PRO_AMM_INIT_CODE_HASH } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import React from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'
import Loader from 'components/Loader'
import { BigNumber } from 'ethers'
import RangeBadge from 'components/Badge/RangeBadge'
import { nativeOnChain } from 'constants/tokens'
import { WETH } from '@vutien/sdk-core'
import { unwrappedToken } from 'utils/wrappedCurrency'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'

export default function ProAmmPoolInfo({ position }: { position: Position }) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const proAmmCoreFactoryAddress = chainId && PRO_AMM_CORE_FACTORY_ADDRESSES[chainId]
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
