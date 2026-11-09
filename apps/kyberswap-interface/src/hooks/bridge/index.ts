import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import contractQuery, { CROSS_CHAIN_BALANCE_CACHE_MS, CROSS_CHAIN_BALANCE_REFRESH_MS } from 'services/contractQuery'

import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { useEvmBalanceAccount } from 'state/wallet/WalletBalanceContext'
import { TokenAmountLoading } from 'state/wallet/hooks'
import { nativeBalanceAmount } from 'utils/nativeErc20'
import { Address } from 'utils/viem'

export const useEthBalanceOfAnotherChain = (chainId: ChainId | undefined) => {
  const account = useEvmBalanceAccount()
  // The query owns snapshots by wallet and chain, including while another chain is being viewed.
  // Cached data is available during render; background refreshes keep it until a new value arrives.
  const { data } = useQuery({
    queryKey: ['native-balance', chainId, account?.toLowerCase()],
    enabled: !!account && !!chainId,
    queryFn: async () => {
      if (!account || !chainId) return null
      const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
      if (!publicClient) throw new Error(`No public client for chain ${chainId}`)
      const balance = await publicClient.getBalance({ address: account as Address })
      return balance.toString()
    },
    staleTime: CROSS_CHAIN_BALANCE_REFRESH_MS,
    gcTime: CROSS_CHAIN_BALANCE_CACHE_MS,
    refetchInterval: CROSS_CHAIN_BALANCE_REFRESH_MS,
  })

  return useMemo(
    () => (account && chainId && data != null ? nativeBalanceAmount(data, chainId) : undefined),
    [account, chainId, data],
  )
}

export type FetchBalancesArg = {
  account?: string
  tokens: Currency[]
  chainId?: ChainId
}

export const fetchBalancesQuery = async ({ account, tokens, chainId }: FetchBalancesArg) => {
  if (!account || !tokens.length || !chainId) return []
  const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
  if (!publicClient) return []

  const results = await publicClient.multicall({
    contracts: tokens.map(token => ({
      address: token.wrapped.address as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    })),
    allowFailure: true,
  })

  return tokens.map((token, i) => {
    const item = results[i]
    if (!item || item.status !== 'success') return [undefined, false]
    const balance = item.result as bigint
    return [CurrencyAmount.fromRawAmount(token, JSBI.BigInt(balance.toString())), false]
  }) as TokenAmountLoading[]
}

export const useTokensBalanceOfAnotherChain = (
  chainId: ChainId | undefined,
  tokens: Currency[],
): [TokenAmountLoading[], boolean] => {
  const account = useEvmBalanceAccount()

  const { currentData: balances, isFetching } = contractQuery.useFetchBalancesQuery(
    {
      account,
      tokens,
      chainId,
    },
    {
      skip: !account || !chainId || !tokens.length,
      pollingInterval: CROSS_CHAIN_BALANCE_REFRESH_MS,
      refetchOnMountOrArgChange: CROSS_CHAIN_BALANCE_REFRESH_MS / 1_000,
    },
  )

  // A new argument can be fetching without isLoading being true. Only its own snapshot settles
  // the initial read; background refreshes keep showing the cached balances.
  return [balances ?? [], !balances && isFetching]
}
