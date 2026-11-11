import { t } from '@lingui/macro'
import { useQuery } from '@tanstack/react-query'
import { getAddress, isAddress, namehash, parseAbi, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'
import { usePublicClient } from 'wagmi'

import type { RecipientAddressType } from './useEvmRecipient'

const parseAddress = (value: string) => {
  try {
    if (!isAddress(value, { strict: true })) return undefined
    const address = getAddress(value)
    return address === zeroAddress ? undefined : address
  } catch {
    return undefined
  }
}

/** Keep user text separate from the validated address passed to quote/build. */
export const useRecipientAddress = (value: string, type: RecipientAddressType) => {
  const client = usePublicClient({ chainId: 1 })
  const network = type.mode === 'evm' ? 'EVM' : type.networkName
  const direct = network === 'EVM' ? parseAddress(value) : undefined
  const needsLookup = !!value && !direct
  const query = useQuery({
    queryKey: ['swap-recipient-address', network, value],
    enabled: needsLookup,
    retry: false,
    // Resolve once per cached network/input; focus and reconnect must not reset a review.
    staleTime: Infinity,
    placeholderData: undefined,
    queryFn: async () => {
      if (network === 'EVM') {
        if (!client || !value.includes('.')) return null
        let name: string
        try {
          name = normalize(value)
        } catch {
          return null
        }
        const address = await client.getEnsAddress({ name })
        if (address) return parseAddress(address) ?? null

        // Legacy resolvers may answer addr directly while Universal Resolver returns null.
        const node = namehash(name)
        const resolver = await client.readContract({
          address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          abi: parseAbi(['function resolver(bytes32 node) view returns (address)']),
          functionName: 'resolver',
          args: [node],
        })
        if (resolver === zeroAddress) return null
        const resolved = await client.readContract({
          address: resolver,
          abi: parseAbi(['function addr(bytes32 node) view returns (address)']),
          functionName: 'addr',
          args: [node],
        })
        return parseAddress(resolved) ?? null
      }
      if (network === 'Solana') {
        const { PublicKey } = await import('@solana/web3.js')
        return new PublicKey(value).toBase58() === value ? value : null
      }
      if (network === 'Bitcoin') {
        const { address, networks } = await import('bitcoinjs-lib')
        address.toOutputScript(value, networks.bitcoin)
        return value
      }
      if (network === 'NEAR') {
        return value.length >= 2 && value.length <= 64 && /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value) ? value : null
      }
      return null
    },
  })
  const loading = needsLookup && query.isFetching
  const address = direct ?? (needsLookup && !query.isError && !loading ? query.data : undefined) ?? undefined
  const message = !value
    ? t`Enter a recipient`
    : loading
    ? t`Resolving recipient`
    : network === 'EVM' && query.isError
    ? t`Enter a recipient`
    : !address
    ? t`Invalid recipient`
    : undefined
  return { address, loading, error: !!value && !loading && !address, message }
}
