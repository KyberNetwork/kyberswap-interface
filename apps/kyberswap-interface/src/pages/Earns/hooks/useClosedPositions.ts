import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'

import { EarnDex } from 'pages/Earns/constants'
import { getPositionLiquidity } from 'pages/Earns/utils/position'

export interface CheckClosedPositionParams {
  tokenId: string
  dex: EarnDex
  poolAddress: string
  chainId: ChainId
}

const useClosedPositions = () => {
  const [closedPositionsFromRpc, setClosedPositionsFromRpc] = useState<
    Array<{
      tokenId: string
      timeRemaining: number
    }>
  >([])

  const checkClosedPosition = async ({
    tokenId,
    poolAddress,
    dex,
    chainId,
  }: {
    tokenId: string
    dex: EarnDex
    poolAddress: string
    chainId: ChainId
  }) => {
    const liquidity = await getPositionLiquidity({
      tokenId,
      poolAddress,
      dex,
      chainId,
    })

    if (liquidity === BigInt(0)) setClosedPositionsFromRpc(prev => [...prev, { tokenId, timeRemaining: 60 * 3 }])
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setClosedPositionsFromRpc(prev =>
        prev
          .filter(closedPosition => closedPosition.timeRemaining > 0)
          .map(closedPosition => {
            return {
              ...closedPosition,
              timeRemaining: closedPosition.timeRemaining - 1,
            }
          }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    closedPositionsFromRpc,
    checkClosedPosition,
  }
}

export default useClosedPositions
