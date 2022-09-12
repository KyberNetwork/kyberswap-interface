import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'

export function useTimestampFromBlock(block: number | undefined): number | undefined {
  const { library } = useWeb3React()
  const [timestamp, setTimestamp] = useState<number>()
  useEffect(() => {
    async function fetchTimestamp() {
      if (block) {
        const blockData = await library?.getBlock(block)
        blockData && setTimestamp(blockData.timestamp)
      }
    }
    if (!timestamp) {
      fetchTimestamp()
    }
  }, [block, library, timestamp])
  return timestamp
}
