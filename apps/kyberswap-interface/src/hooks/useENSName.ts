import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useENSRegistrarContract, useENSResolverContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { NEVER_RELOAD, useSingleCallResult } from 'state/multicall/hooks'
import { isAddress } from 'utils'
import isZero from 'utils/isZero'
import { namehash } from 'utils/viem'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(address?: string): { ENSName: string | null; loading: boolean } {
  const { chainId } = useActiveWeb3React()
  const debouncedAddress = useDebounce(address, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedAddress || !isAddress(chainId, debouncedAddress)) return [undefined]
    try {
      return debouncedAddress ? [namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [chainId, debouncedAddress])
  const registrarContract = useENSRegistrarContract()
  // ENS resolution doesn't change per block — opt out of the per-block
  // refetch the global readContract invalidation otherwise triggers.
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument, NEVER_RELOAD)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
  )
  const name = useSingleCallResult(resolverContract, 'name', ensNodeArgument, NEVER_RELOAD)

  const changed = debouncedAddress !== address
  return {
    ENSName: changed ? null : name.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || name.loading,
  }
}
