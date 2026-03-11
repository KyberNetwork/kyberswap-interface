import { ChainId, PoolType } from '@kyber/schema'
import { getNftManagerContractAddress } from '@kyber/utils'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { useUserPositionsQuery } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'
import { SmartExit } from 'pages/Earns/components/SmartExit'
import { Exchange } from 'pages/Earns/constants'
import { ParsedPosition, UserPosition } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'

// Map PoolType from widget to Exchange
const poolTypeToExchange: Record<number, Exchange> = {
  [PoolType.DEX_UNISWAPV3]: Exchange.DEX_UNISWAPV3,
  [PoolType.DEX_UNISWAP_V4]: Exchange.DEX_UNISWAP_V4,
  [PoolType.DEX_UNISWAP_V4_FAIRFLOW]: Exchange.DEX_UNISWAP_V4_FAIRFLOW,
  [PoolType.DEX_PANCAKESWAPV3]: Exchange.DEX_PANCAKESWAPV3,
  [PoolType.DEX_PANCAKE_INFINITY_CL]: Exchange.DEX_PANCAKE_INFINITY_CL,
  [PoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
}

export interface SmartExitParams {
  tokenId: string
  chainId: ChainId
  poolType: PoolType
}

/**
 * Custom hook to manage Smart Exit widget state and rendering
 * @returns Object containing smartExitPosition, onOpenSmartExit callback, and smartExitWidget JSX
 */
export default function useSmartExitWidget(): {
  smartExitPosition: ParsedPosition | null
  onOpenSmartExit: (params: SmartExitParams | ParsedPosition | undefined) => void
  smartExitWidget: ReactElement | null
} {
  const { account } = useActiveWeb3React()
  const [smartExitPosition, setSmartExitPosition] = useState<ParsedPosition | null>(null)
  const [smartExitParams, setSmartExitParams] = useState<SmartExitParams | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Build positionId in format: nftContract-tokenId
  const positionId = smartExitParams
    ? `${getNftManagerContractAddress(smartExitParams.poolType, smartExitParams.chainId)}-${smartExitParams.tokenId}`
    : undefined

  const exchange = smartExitParams ? poolTypeToExchange[smartExitParams.poolType] : undefined

  const { data: userPositionsData, isLoading } = useUserPositionsQuery(
    {
      wallet: account || '',
      chainIds: smartExitParams?.chainId.toString() || '',
      protocols: exchange || '',
      positionIds: positionId,
    },
    {
      skip: !smartExitParams || !positionId || !exchange,
      pollingInterval: smartExitPosition ? 0 : 3000, // Poll every 3s until we get position
    },
  )

  // Parse position when data arrives
  useEffect(() => {
    if (userPositionsData && userPositionsData.positions.length > 0 && !smartExitPosition && positionId) {
      const rawPosition = userPositionsData.positions[0] as UserPosition
      const parsed = parsePosition({ position: rawPosition })
      // Verify the fetched position matches the requested positionId to avoid stale data
      if (parsed.positionId.toLowerCase() === positionId.toLowerCase()) {
        setSmartExitPosition(parsed)
      }
    }
  }, [userPositionsData, smartExitPosition, positionId])

  const onOpenSmartExit = useCallback((params: SmartExitParams | ParsedPosition | undefined) => {
    if (!params) {
      setSmartExitParams(null)
      setSmartExitPosition(null)
      setIsOpen(false)
      return
    }

    // Check if it's a ParsedPosition (has 'id' property) or SmartExitParams (has 'tokenId' property)
    if ('id' in params && 'dex' in params) {
      // It's a ParsedPosition - open directly
      setSmartExitPosition(params as ParsedPosition)
      setSmartExitParams(null)
      setIsOpen(true)
    } else if ('tokenId' in params && 'poolType' in params) {
      // It's SmartExitParams - need to fetch position
      setSmartExitParams(params as SmartExitParams)
      setSmartExitPosition(null) // Clear any existing position
      setIsOpen(true)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setSmartExitParams(null)
    setSmartExitPosition(null)
    setIsOpen(false)
  }, [])

  // Determine loading state: we're loading if we have params but no position yet
  const isLoadingPosition = isOpen && smartExitParams && !smartExitPosition && isLoading

  const smartExitWidget = isOpen ? (
    <SmartExit position={smartExitPosition} onDismiss={handleDismiss} isLoading={isLoadingPosition || false} />
  ) : null

  return {
    smartExitPosition,
    onOpenSmartExit,
    smartExitWidget,
  }
}
