import { useMemo } from 'react'

import { useENSRegistrarContract, useENSResolverContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { NEVER_RELOAD, useSingleCallResult } from 'state/multicall/hooks'
import isZero from 'utils/isZero'
import { namehash } from 'utils/viem'

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): { loading: boolean; address: string | null } {
  const debouncedName = useDebounce(ensName, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedName) return [undefined]
    try {
      return debouncedName ? [namehash(debouncedName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [debouncedName])
  const registrarContract = useENSRegistrarContract()
  // ENS resolution doesn't change per block — opt out of the per-block
  // refetch the global readContract invalidation otherwise triggers.
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
  )
  const addr = useSingleCallResult(resolverContract, 'addr', ensNodeArgument, NEVER_RELOAD)

  const changed = debouncedName !== ensName
  return {
    address: changed ? null : addr.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || addr.loading,
  }
}
