import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { erc20Abi, isAddress } from 'viem'
import { usePublicClient } from 'wagmi'

import { SOLANA_NATIVE } from 'pages/Swap/crossChain/utils'
import { Chain, Currency, NonEvmChain } from 'types/crossChain'

/** Read-only balance lookup; both panels read by address without borrowing global wallet balances. */
export const useCrossChainBalance = (chain: Chain, currency?: Currency, address?: string) => {
  const publicClient = usePublicClient({ chainId: typeof chain === 'number' ? chain : undefined })
  const { connection } = useConnection()
  const { getBalance, viewFunction } = useWalletSelector()
  const token =
    currency && 'isNative' in currency
      ? currency.isNative
        ? 'native'
        : currency.wrapped.address
      : currency && 'assetId' in currency
      ? currency.contractAddress
      : currency && 'id' in currency
      ? currency.id
      : ''

  const { data } = useQuery({
    queryKey: ['cross-chain-wallet-balance', chain, token, address],
    enabled: !!address && !!currency && (typeof chain !== 'number' || (!!publicClient && isAddress(address))),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!address) return undefined
      if (typeof chain === 'number') {
        if (!publicClient || !isAddress(address)) return undefined
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
      }
      if (chain === NonEvmChain.Bitcoin) {
        const response = await fetch(`https://api.blockchain.info/haskoin-store/btc/address/${address}/balance`, {
          signal,
        })
        if (!response.ok) throw new Error('Could not load wallet balance')
        return String((await response.json()).confirmed || 0)
      }
      if (chain === NonEvmChain.Near) {
        // These selector helpers are read-only RPC calls with an explicit owner;
        // the selector's signed-in account does not choose the balance address.
        if (!token) return (await getBalance(address)).toString()
        return String(await viewFunction({ contractId: token, method: 'ft_balance_of', args: { account_id: address } }))
      }
      const owner = new PublicKey(address)
      if (token === SOLANA_NATIVE) return String(await connection.getBalance(owner))
      const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(token) })
      return accounts.value
        .reduce((total, account) => total + BigInt(account.account.data.parsed.info.tokenAmount.amount), 0n)
        .toString()
    },
  })
  return data
}
