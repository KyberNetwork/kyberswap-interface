import { useQuery } from '@tanstack/react-query'
import { erc20Abi, isAddress } from 'viem'
import { usePublicClient } from 'wagmi'

import type { Chain, Currency } from 'types/crossChain'

/** Address-scoped EVM balances without loading non-EVM wallet providers. */
export const useEvmAddressBalance = (chain: Chain, currency?: Currency, address?: string) => {
  const publicClient = usePublicClient({ chainId: typeof chain === 'number' ? chain : undefined })
  const token = currency && 'isNative' in currency ? (currency.isNative ? 'native' : currency.wrapped.address) : ''
  const { data } = useQuery({
    queryKey: ['evm-address-balance', chain, token, address],
    enabled: typeof chain === 'number' && !!token && !!publicClient && !!address && isAddress(address),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
    queryFn: async () => {
      if (!publicClient || !address || !isAddress(address)) return undefined
      return String(
        token === 'native'
          ? await publicClient.getBalance({ address })
          : await publicClient.readContract({
              address: token as `0x${string}`,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address],
            }),
      )
    },
  })
  return data
}
