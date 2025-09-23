import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react'
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
// import { clusterApiUrl } from '@solana/web3.js'
import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { SOLANA_RPC } from 'constants/env'
import { SOLANA_NATIVE } from 'constants/index'
import { SolanaConnectModalProvider } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'

interface SolanaProviderProps {
  children: ReactNode
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // const network = WalletAdapterNetwork.Mainnet

  // You can also provide a custom RPC endpoint
  // const endpoint = useMemo(() => clusterApiUrl(network), [network])

  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={[]} autoConnect>
        <SolanaConnectModalProvider>
          <SolanaTokenBalances>{children}</SolanaTokenBalances>
        </SolanaConnectModalProvider>
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

const SolanaTokenBalanceContext = createContext<Record<string, SolanaTokenBalance> | null>(null)

const SolanaTokenBalances: FC<SolanaProviderProps> = ({ children }) => {
  const [balances, setBalances] = useState<Record<string, SolanaTokenBalance>>({})
  const { publicKey: solanaAddress } = useWallet()
  const connection = useConnection()

  useEffect(() => {
    if (!solanaAddress) return
    const fetchBalance = async () => {
      const nativeBalance = await connection.connection.getBalance(solanaAddress)
      const tokenAccounts = await connection.connection.getParsedTokenAccountsByOwner(solanaAddress, {
        programId: TOKEN_PROGRAM_ID,
      })
      const b = tokenAccounts.value
        .map(account => {
          const info = account.account.data.parsed.info
          return {
            mint: info.mint,
            balance: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
            rawAmount: info.tokenAmount.amount,
          }
        })
        .reduce((acc, curr) => ({ ...acc, [curr.mint]: curr }), {} as Record<string, SolanaTokenBalance>)
      setBalances({
        [SOLANA_NATIVE]: {
          mint: SOLANA_NATIVE,
          balance: nativeBalance / 1e9, // Convert lamports to SOL
          decimals: 9,
          rawAmount: nativeBalance.toString(),
        },
        ...b,
      })
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000) // Update every 20 seconds
    return () => clearInterval(interval)
  }, [solanaAddress, connection])

  return <SolanaTokenBalanceContext.Provider value={balances}>{children}</SolanaTokenBalanceContext.Provider>
}

export const useSolanaTokenBalances = () => {
  const context = useContext(SolanaTokenBalanceContext)
  if (!context) {
    throw new Error('useSolanaTokenBalances must be used within a SolanaTokenBalances provider')
  }
  return context
}
