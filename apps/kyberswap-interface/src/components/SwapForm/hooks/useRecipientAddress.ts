import * as ecc from '@bitcoinerlab/secp256k1'
import { t } from '@lingui/macro'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { address as bitcoinAddress, initEccLib, networks } from 'bitcoinjs-lib'
import { namehash, parseAbi, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'
import { usePublicClient } from 'wagmi'

import { isAddress } from 'utils/address'

import type { RecipientAddressType } from './useEvmRecipient'

// Taproot output scripts require ECC even when only validating a receiving address.
initEccLib(ecc)

// The shared validator accepts unchecksummed upper/lowercase and zero addresses,
// normalizes the prefix/checksum, and still rejects incorrect mixed-case checksums.
const parseAddress = (value: string) => isAddress(1, value) || undefined

const parseRecipientAddress = (value: string, network: string) => {
  try {
    if (network === 'EVM') return parseAddress(value)
    if (network === 'Solana') return new PublicKey(value).toBase58() === value ? value : undefined
    if (network === 'Bitcoin') {
      bitcoinAddress.toOutputScript(value, networks.bitcoin)
      return value
    }
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
  const needsLookup = network === 'EVM' && !!value && !direct
  const query = useQuery({
    queryKey: ['swap-recipient-address', network, value],
    enabled: needsLookup,
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
