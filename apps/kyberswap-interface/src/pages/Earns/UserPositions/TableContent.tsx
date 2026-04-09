import { toString } from '@kyber/utils/dist/number'
import { MAX_TICK, MIN_TICK, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetSmartExitOrdersQuery } from 'services/smartExit'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { APP_PATHS, ETHER_ADDRESS, PAIR_CATEGORY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import PositionRowItem from 'pages/Earns/UserPositions/PositionRowItem'
import { EmptyPositionText } from 'pages/Earns/UserPositions/styles'
import { SmartExit } from 'pages/Earns/components/SmartExit'
import { EARN_CHAINS, EARN_DEXES, EarnChain } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { ZapOutInfo } from 'pages/Earns/hooks/useZapOutWidget'
import { FeeInfo, OrderStatus, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

export interface FeeInfoFromRpc extends FeeInfo {
  id: string
  timeRemaining: number
}

export default function TableContent({
  positions,
  setFeeInfoFromRpc,
  onOpenZapInWidget,
  onOpenZapOut,
  onOpenZapMigration,
  kemRewards,
}: {
  positions: Array<ParsedPosition>
  setFeeInfoFromRpc: React.Dispatch<React.SetStateAction<FeeInfoFromRpc[]>>
  onOpenZapInWidget: ({ pool, positionId }: ZapInInfo) => void
  onOpenZapOut: ({ position }: ZapOutInfo) => void
  onOpenZapMigration: (params: ZapMigrationInfo) => void
  kemRewards: {
    onOpenClaim: (position?: ParsedPosition) => void
    pendingClaimKeys: string[]
  }
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToCustomLarge = useMedia(`(max-width: ${1300}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)
  const [smartExitPosition, setSmartExitPosition] = useState<ParsedPosition | null>(null)

  const { data: smartExitOrders } = useGetSmartExitOrdersQuery(
    {
      userWallet: account || '',
      positionIds: positions?.map(pos => pos.positionId) || [],
      status: OrderStatus.OrderStatusOpen,
      page: 1,
      pageSize: positions?.length || 10,
    },
    {
      skip: (positions?.length || 0) === 0,
    },
  )
  const smartExitPosIds = smartExitOrders?.orders.map(order => order.positionId) || []

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    pendingClaimKeys: pendingFeeClaimKeys,
  } = useCollectFees({
    refetchAfterCollect: claimKey => {
      if (!claimKey) return
      const [claimChainId, claimTokenId] = claimKey.split(':')
      const position = positions.find(
        item => item.chain.id === Number(claimChainId) && String(item.tokenId) === claimTokenId,
      )
      handleFetchUnclaimedFee(position || null)
    },
  })

  const { onOpenClaim: onOpenClaimRewards, pendingClaimKeys: pendingRewardClaimKeys } = kemRewards

  const { rewardsByPosition } = useMerklRewards({ positions })

  const uniqueFarmingChainIds = useMemo(() => {
    if (!positions || positions.length === 0) return []
    const chainIds = positions
      .map(position => position.chain.id)
      .filter(chainId => !!EARN_CHAINS[chainId as EarnChain]?.farmingSupported)
    return [...new Set(chainIds)]
  }, [positions])

  const farmingPoolsByChain = useFarmingStablePools({ chainIds: uniqueFarmingChainIds })

  const handleFetchUnclaimedFee = useCallback(
    async (position: ParsedPosition | null) => {
      if (!position) return

      const feeFromRpc = await getUnclaimedFeesInfo(position)

      const { tokenId } = position
      const feeInfoToAdd = {
        ...feeFromRpc,
        id: tokenId,
        timeRemaining: 60 * 2,
      }

      setFeeInfoFromRpc(prev => {
        const index = prev.findIndex(feeInfo => feeInfo.id === tokenId)
        if (index !== -1) {
          const updated = [...prev]
          updated[index] = feeInfoToAdd
          return updated
        }
        return [...prev, feeInfoToAdd]
      })
    },
    [setFeeInfoFromRpc],
  )

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = EARN_DEXES[position.dex.id].isForkFrom === CoreProtocol.UniswapV2
    onOpenZapInWidget({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: position.status === PositionStatus.CLOSED ? undefined : isUniv2 ? account || '' : position.tokenId,
    })
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = EARN_DEXES[position.dex.id].isForkFrom === CoreProtocol.UniswapV2
    onOpenZapOut({
      position: {
        dex: position.dex.id,
        chainId: position.chain.id,
        id: isUniv2 ? account || '' : position.tokenId,
        poolAddress: position.pool.address,
      },
    })
  }

  const handleClaimFees = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (position.pool.isUniv2 || position.unclaimedFees === 0) return
    onOpenClaimFees(position)
  }

  const handleClaimRewards = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (position.rewards.unclaimedUsdValue === 0) return
    onOpenClaimRewards(position)
  }

  const handleMigrateToKem = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()

    if (!!position.suggestionPool) {
      handleOpenMigration(position, position.suggestionPool)
    } else if (
      position.pool.category === PAIR_CATEGORY.STABLE &&
      farmingPoolsByChain[position.chain.id]?.pools.length > 0
    )
      setPositionToMigrate(position)
  }

  const handleOpenMigration = (sourcePosition: ParsedPosition, targetPool: SuggestedPool) => {
    const sourceMinPrice = sourcePosition.priceRange.min
    const sourceMaxPrice = sourcePosition.priceRange.max
    const targetToken0Decimals = targetPool.token0.decimals
    const targetToken1Decimals = targetPool.token1.decimals

    const isSameTokenAddress = (address1: string, address2: string, chainId: number): boolean => {
      const addr1Lower = address1.toLowerCase()
      const addr2Lower = address2.toLowerCase()

      if (addr1Lower === addr2Lower) return true

      const chainIdKey = chainId as keyof typeof WETH
      const nativeAddress = ETHER_ADDRESS.toLowerCase()
      const wrappedNativeAddress = WETH[chainIdKey].address.toLowerCase()
      return (
        (addr1Lower === nativeAddress && addr2Lower === wrappedNativeAddress) ||
        (addr1Lower === wrappedNativeAddress && addr2Lower === nativeAddress)
      )
    }

    // Check if tokens are in the same order by comparing addresses (considering WETH/ETH equivalence)
    const chainId = sourcePosition.chain.id
    const isTokenOrderSame =
      isSameTokenAddress(sourcePosition.token0.address, targetPool.token0.address, chainId) &&
      isSameTokenAddress(sourcePosition.token1.address, targetPool.token1.address, chainId)

    const isMinPrice = sourcePosition.priceRange.isMinPrice
    const isMaxPrice = sourcePosition.priceRange.isMaxPrice

    const tickLower = sourcePosition.pool.isUniv2
      ? undefined
      : isTokenOrderSame
      ? isMinPrice
        ? MIN_TICK
        : priceToClosestTick(toString(sourceMinPrice), targetToken0Decimals, targetToken1Decimals)
      : isMaxPrice
      ? MAX_TICK
      : priceToClosestTick(toString(1 / sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)

    const tickUpper = sourcePosition.pool.isUniv2
      ? undefined
      : isTokenOrderSame
      ? isMaxPrice
        ? MAX_TICK
        : priceToClosestTick(toString(sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)
      : isMinPrice
      ? MIN_TICK
      : priceToClosestTick(toString(1 / sourceMinPrice), targetToken0Decimals, targetToken1Decimals)

    const isOutRange = sourcePosition.status === PositionStatus.OUT_RANGE

    onOpenZapMigration({
      chainId: sourcePosition.chain.id,
      from: {
        poolType: sourcePosition.dex.id,
        poolAddress: sourcePosition.pool.address,
        positionId: sourcePosition.pool.isUniv2 ? account || '' : sourcePosition.tokenId,
        dexId: sourcePosition.dex.id,
      },
      to: {
        poolType: targetPool.exchange,
        poolAddress: targetPool.address,
        dexId: targetPool.exchange,
      },
      initialTick:
        tickLower !== undefined && tickUpper !== undefined && !isOutRange
          ? {
              tickLower: tickLower,
              tickUpper: tickUpper,
            }
          : undefined,
    })
  }

  const handleReposition = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    onOpenZapMigration({
      chainId: position.chain.id,
      from: {
        poolType: position.dex.id,
        poolAddress: position.pool.address,
        positionId: position.pool.isUniv2 ? account || '' : position.tokenId,
        dexId: position.dex.id,
      },
      rePositionMode: true,
    })
  }

  const emptyPosition = (
    <EmptyPositionText>
      <IconEarnNotFound />
      <Flex flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: 1 }} marginBottom={12}>
        <Text color={theme.subText}>{t`You don't have any liquidity positions yet`}.</Text>
        <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
      </Flex>
      {!account && <PositionActionBtn onClick={toggleWalletModal}>{t`Connect Wallet`}</PositionActionBtn>}
    </EmptyPositionText>
  )

  const migrationModal =
    positionToMigrate && farmingPoolsByChain[positionToMigrate.chain.id]?.pools.length > 0 ? (
      <MigrationModal
        positionToMigrate={positionToMigrate}
        farmingPools={farmingPoolsByChain[positionToMigrate.chain.id].pools}
        onOpenMigration={handleOpenMigration}
        onClose={() => setPositionToMigrate(null)}
      />
    ) : null

  return (
    <>
      {claimFeesModal}
      {migrationModal}
      {smartExitPosition && <SmartExit position={smartExitPosition} onDismiss={() => setSmartExitPosition(null)} />}

      <div>
        {account && positions && positions.length > 0
          ? positions.map((position, index) => (
              <PositionRowItem
                key={`${position.tokenId}-${position.pool.address}-${index}`}
                position={position}
                index={index}
                smartExitPosIds={smartExitPosIds}
                pendingFeeClaimKeys={pendingFeeClaimKeys}
                pendingRewardClaimKeys={pendingRewardClaimKeys}
                rewardsByPosition={rewardsByPosition}
                farmingPoolsByChain={farmingPoolsByChain}
                upToCustomLarge={upToCustomLarge}
                upToSmall={upToSmall}
                onOpenIncreaseLiquidity={handleOpenIncreaseLiquidityWidget}
                onOpenZapOut={handleOpenZapOut}
                onClaimFees={handleClaimFees}
                onClaimRewards={handleClaimRewards}
                onReposition={handleReposition}
                onMigrateToKem={handleMigrateToKem}
                onOpenSmartExit={setSmartExitPosition}
              />
            ))
          : emptyPosition}
      </div>
    </>
  )
}
