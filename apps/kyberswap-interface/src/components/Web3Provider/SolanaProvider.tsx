import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react'
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
// import { clusterApiUrl } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { ComponentProps, FC, ReactNode } from 'react'
import { SOLANA_NATIVE } from 'services/crossChain/utils'

import { SolanaConnectModalProvider } from 'components/Web3Provider/SolanaConnectModalProvider'
import { SOLANA_RPC } from 'constants/env'
import { useWalletBalanceAddress } from 'state/wallet/WalletBalanceContext'
import { NonEvmChain } from 'types/crossChain'

interface SolanaProviderProps {
  children: ReactNode
}

// ConnectionProvider memoizes `new Connection(endpoint, config)` keyed on `config` identity; the library's
// default `config`/`wallets` are fresh objects each render. Stable module-level references keep `connection`
// (and the wallet adapters) referentially stable so consumers don't refetch on every re-render.
const SOLANA_CONNECTION_CONFIG: ComponentProps<typeof ConnectionProvider>['config'] = { commitment: 'confirmed' }
const SOLANA_WALLETS: ComponentProps<typeof WalletProvider>['wallets'] = []

// OKX's Solana Standard wallet ignores the adapter's `silent` flag and pops an approval dialog on
// auto-reconnect, which fires on every mount of this route-level provider. Returning false skips
// autoConnect for it (no prompt; the user connects manually); every other wallet keeps the silent
// adapter.autoConnect() path. WalletProvider short-circuits before any connect() call on a falsy return.
const SOLANA_AUTO_CONNECT = (adapter: { name: string }): Promise<boolean> => Promise.resolve(!/okx/i.test(adapter.name))

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // const network = WalletAdapterNetwork.Mainnet

  // You can also provide a custom RPC endpoint
  // const endpoint = useMemo(() => clusterApiUrl(network), [network])

  return (
    <ConnectionProvider endpoint={SOLANA_RPC} config={SOLANA_CONNECTION_CONFIG}>
      <WalletProvider wallets={SOLANA_WALLETS} autoConnect={SOLANA_AUTO_CONNECT}>
        <SolanaConnectModalProvider>{children}</SolanaConnectModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

interface SolanaTokenBalance {
  mint: string
  balance: number
  decimals: number
  rawAmount: string
}

const EMPTY_BALANCES: Record<string, SolanaTokenBalance> = {}

/** All consumers share one address-keyed poll, including an independently selected swap wallet. */
export const useSolanaTokenBalances = () => {
  const { publicKey } = useWallet()
  const address = useWalletBalanceAddress(NonEvmChain.Solana, publicKey?.toString())
  const { connection } = useConnection()
  const { data } = useQuery({
    queryKey: ['solana-token-balances', connection.rpcEndpoint, address],
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: false,
    queryFn: async () => {
      if (!address) return EMPTY_BALANCES
      const owner = new PublicKey(address)
      const [nativeBalance, tokenAccounts] = await Promise.all([
        connection.getBalance(owner),
        connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
      ])
      const balances: Record<string, SolanaTokenBalance> = {}
      for (const account of tokenAccounts.value) {
        const { mint, tokenAmount } = account.account.data.parsed.info
        const rawAmount = (BigInt(balances[mint]?.rawAmount || '0') + BigInt(tokenAmount.amount)).toString()
        balances[mint] = {
          mint,
          rawAmount,
          decimals: tokenAmount.decimals,
          balance: Number(rawAmount) / 10 ** tokenAmount.decimals,
        }
      }
      return {
        ...balances,
        [SOLANA_NATIVE]: {
          mint: SOLANA_NATIVE,
          rawAmount: String(nativeBalance),
          decimals: 9,
          balance: nativeBalance / 1e9,
        },
      }
    },
  })
  return address ? data ?? EMPTY_BALANCES : EMPTY_BALANCES
}
