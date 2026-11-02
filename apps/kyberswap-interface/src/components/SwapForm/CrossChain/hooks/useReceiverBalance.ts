import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

import { SOLANA_NATIVE } from 'pages/Swap/crossChain/utils'
import { Currency, NonEvmChain } from 'types/crossChain'

/** Read-only balance lookup; the receiver never borrows a sender's wallet balance or signing context. */
export const useReceiverBalance = (chain: NonEvmChain, currency?: Currency, address?: string) => {
  const { connection } = useConnection()
  const { getBalance, viewFunction } = useWalletSelector()
  const token =
    currency && 'assetId' in currency ? currency.contractAddress : currency && 'id' in currency ? currency.id : ''

  const { data } = useQuery({
    queryKey: ['cross-chain-receiver-balance', chain, token, address],
    enabled: !!address && !!currency,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!address) return undefined
      if (chain === NonEvmChain.Bitcoin) {
        const response = await fetch(`https://api.blockchain.info/haskoin-store/btc/address/${address}/balance`, {
          signal,
        })
        if (!response.ok) throw new Error('Could not load receiver balance')
        return String((await response.json()).confirmed || 0)
      }
      if (chain === NonEvmChain.Near) {
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
