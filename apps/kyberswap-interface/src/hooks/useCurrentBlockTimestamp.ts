import { useMulticallContract } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): bigint | undefined {
  const multicall = useMulticallContract()
  return useSingleCallResult(multicall, 'getCurrentBlockTimestamp')?.result?.[0] as bigint | undefined
}
