import { useSingleCallResult } from 'state/multicall/hooks'

import { useMulticallContract } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): bigint | undefined {
  const multicall = useMulticallContract()
  const result = useSingleCallResult(multicall, 'getCurrentBlockTimestamp')?.result?.[0]
  return result !== undefined ? BigInt(result.toString()) : undefined
}
