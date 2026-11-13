import { t } from '@lingui/macro'
import { useQuery } from '@tanstack/react-query'
import { namehash, parseAbi, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'
import { usePublicClient } from 'wagmi'

import { isAddress } from 'utils/address'

import type { RecipientAddressType } from './useEvmRecipient'

// The shared validator accepts unchecksummed upper/lowercase and zero addresses,
// normalizes the prefix/checksum, and still rejects incorrect mixed-case checksums.
const parseAddress = (value: string) => isAddress(1, value) || undefined

const parseRecipientAddress = (value: string, network: string) => {
  try {
    if (network === 'EVM') return parseAddress(value)
    if (network === 'NEAR') {
      return value.length >= 2 && value.length <= 64 && /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value) ? value : undefined
    }
    return undefined
  } catch {
    return undefined
  }
}

/** Keep user text separate from the validated address passed to quote/build. */
export const useRecipientAddress = (value: string, type: RecipientAddressType) => {
  const client = usePublicClient({ chainId: 1 })
  const network = type.mode === 'evm' ? 'EVM' : type.networkName
  const direct = parseRecipientAddress(value, network)
  const needsLookup = !!value && !direct && ['EVM', 'Bitcoin', 'Solana'].includes(network)
  const query = useQuery({
    queryKey: ['swap-recipient-address', network, value],
    enabled: needsLookup,
    // Local validation (including SDK-load fallback) can finish while offline.
    networkMode: network === 'EVM' ? 'online' : 'always',
    // Inherit the default RPC retries, like the legacy ENS contract reads.
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
        // Resolve directly through the registered resolver, as the legacy swap form did.
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
        // A zero ENS record means no destination, unlike an explicitly entered zero address.
        return resolved === zeroAddress ? null : parseAddress(resolved) ?? null
      }
      if (network === 'Solana') {
        const sdk = await import('@solana/web3.js').catch(() => null)
        // If the chunk cannot load, defer validation to the route provider.
        if (!sdk) return value
        try {
          return new sdk.PublicKey(value).toBase58() === value ? value : null
        } catch {
          return null
        }
      }
      if (network === 'Bitcoin') {
        const sdk = await Promise.all([import('bitcoinjs-lib'), import('@bitcoinerlab/secp256k1')]).catch(() => null)
        if (!sdk) return value
        const [bitcoin, ecc] = sdk
        // Taproot validation requires ECC; loading errors alone may bypass validation.
        bitcoin.initEccLib(ecc)
        try {
          bitcoin.address.toOutputScript(value, bitcoin.networks.bitcoin)
          return value
        } catch {
          return null
        }
      }
      return null
    },
  })
  const loading = needsLookup && (query.isFetching || query.isPaused)
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
