import { useEffect, useState } from 'react'

import { useWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'

export function useTimestampFromBlock(block: number | undefined): number | undefined {
  const { chainId } = useWeb3React()
  const { readProvider } = useKyberSwapConfig(chainId)
  const [timestamp, setTimestamp] = useState<number>()
  useEffect(() => {
    async function fetchTimestamp() {
      if (block && readProvider) {
        const blockData = await readProvider.getBlock(block)
        blockData && setTimestamp(blockData.timestamp)
      }
    }
    if (!timestamp && readProvider) {
      fetchTimestamp()
    }
  }, [block, readProvider, timestamp])
  return timestamp
}
