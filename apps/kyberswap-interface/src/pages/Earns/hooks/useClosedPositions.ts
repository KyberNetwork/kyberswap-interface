import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Exchange } from 'pages/Earns/constants'
import { getPositionLiquidity } from 'pages/Earns/utils/position'

export interface CheckClosedPositionParams {
  tokenId: string
  dex: Exchange
  poolAddress: string
  chainId: ChainId
}

const useClosedPositions = () => {
  const [closedPositionsFromRpc, setClosedPositionsFromRpc] = useState<Array<{ tokenId: string }>>([])
  const clearTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const checkClosedPosition = useCallback(
    async ({
      tokenId,
      poolAddress,
      dex,
      chainId,
    }: {
      tokenId: string
      dex: Exchange
      poolAddress: string
      chainId: ChainId
    }) => {
      const liquidity = await getPositionLiquidity({ tokenId, poolAddress, dex, chainId })

      if (liquidity !== BigInt(0)) return

      setClosedPositionsFromRpc(prev => (prev.some(item => item.tokenId === tokenId) ? prev : [...prev, { tokenId }]))

      const existingTimeout = clearTimersRef.current.get(tokenId)
      if (existingTimeout) clearTimeout(existingTimeout)

      const timeout = setTimeout(() => {
        setClosedPositionsFromRpc(prev => prev.filter(item => item.tokenId !== tokenId))
        clearTimersRef.current.delete(tokenId)
      }, 60 * 3 * 1000)

      clearTimersRef.current.set(tokenId, timeout)
    },
    [],
  )

  useEffect(() => {
    const timers = clearTimersRef.current
    return () => {
      timers.forEach(timeout => clearTimeout(timeout))
      timers.clear()
    }
  }, [])

  return {
    closedPositionsFromRpc,
    checkClosedPosition,
  }
}

export default useClosedPositions
