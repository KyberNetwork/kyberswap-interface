import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

import { Address, Hex } from './viem'

export type AccessListEntry = { address: Address; storageKeys: Hex[] }

/**
 * Best-effort `eth_createAccessList` lookup for chains that opt-in via
 * `NETWORKS_INFO[chainId].accessListEnabled`. Returns `undefined` when the
 * chain doesn't support it or when the RPC rejects the request — callers
 * should treat the access list as a gas-saving hint, not a requirement.
 *
 * `publicClient` is typed `any` because viem's `request()` is typed against an
 * RPC schema and the wagmi-resolved client's chain-union variant clashes with
 * viem's base `PublicClient` here. The runtime contract is `EIP1193`'s
 * `request({ method, params })`; the call only ever hits `eth_createAccessList`,
 * which isn't in viem's default RPC schema either, so we use `as any` on the
 * method name regardless.
 */
export async function createAccessListIfEnabled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicClient: any,
  chainId: ChainId,
  params: { from: string; to: string; data: string; value?: bigint },
): Promise<AccessListEntry[] | undefined> {
  if (!NETWORKS_INFO[chainId]?.accessListEnabled) return undefined

  try {
    const result = (await publicClient.request({
      method: 'eth_createAccessList' as any,
      params: [
        {
          from: params.from,
          to: params.to,
          data: params.data,
          ...(params.value !== undefined ? { value: `0x${params.value.toString(16)}` } : {}),
        },
        'latest',
      ] as any,
    })) as { accessList?: AccessListEntry[] } | undefined

    return Array.isArray(result?.accessList) ? result.accessList : undefined
  } catch {
    // Chain may not support eth_createAccessList, or the RPC rejected the call.
    return undefined
  }
}
