import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import '@near-wallet-selector/modal-ui/styles.css'

import { AccountState, setupWalletSelector } from '@near-wallet-selector/core'
import { setupModal } from '@near-wallet-selector/modal-ui'
import { setupNearWallet } from '@near-wallet-selector/near-wallet'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupSender } from '@near-wallet-selector/sender'
import { setupHereWallet } from '@near-wallet-selector/here-wallet'
import { setupMathWallet } from '@near-wallet-selector/math-wallet'
import { setupNightly } from '@near-wallet-selector/nightly'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'

import { setupLedger } from '@near-wallet-selector/ledger'
import { utils } from 'near-api-js'

// interface NEARNetworkConfig {
//   networkId: string
//   nodeUrl: string
//   walletUrl: string
//   helperUrl: string
//   explorerUrl: string
// }

// Network configurations
// const config: NEARNetworkConfig = {
//   networkId: 'mainnet',
//   nodeUrl: 'https://rpc.mainnet.near.org',
//   walletUrl: 'https://wallet.near.org',
//   helperUrl: 'https://helper.mainnet.near.org',
//   explorerUrl: 'https://explorer.mainnet.near.org',
// }

// NEAR wallet connection state
interface NEARWalletState {
  isConnected: boolean
  accountId: string | null
  balance: string | null
  selectedWalletId: string | null
}

// Transaction options
interface TransactionOptions {
  contractId: string
  methodName: string
  args?: Record<string, any>
  gas?: string
  deposit?: string
}

// Context shape
interface NEARWalletContextType {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  walletState: NEARWalletState
  signAndSendTransaction: (options: TransactionOptions) => Promise<string | null>
  sendTokens: (receiverId: string, amount: string) => Promise<string | null>
  signMessage: (message: string) => Promise<string | null>
  openModal: () => void
  accounts: AccountState[]
}

// Create context
const NEARWalletContext = createContext<NEARWalletContextType | undefined>(undefined)

// Provider component
export default function NEARWalletProvider({ children }: { children: ReactNode }) {
  // State for the NEAR wallet
  const [walletState, setWalletState] = useState<NEARWalletState>({
    isConnected: false,
    accountId: null,
    balance: null,
    selectedWalletId: null,
  })

  // State for wallet selector
  const [selector, setSelector] = useState<any>(null)
  const [modal, setModal] = useState<any>(null)
  const [accounts, setAccounts] = useState<Array<AccountState>>([])

  // Initialize wallet selector
  useEffect(() => {
    const init = async () => {
      const selector = await setupWalletSelector({
        network: 'mainnet',
        debug: true,
        modules: [
          setupMyNearWallet(),
          setupNearWallet(),
          setupSender(),
          setupMeteorWallet(),
          setupHereWallet(),
          setupLedger(),
          setupMathWallet(),
          setupNightly(),
          // setupWalletConnect({
          //   projectId: 'b5b37945209ea323811f1032e84eaeb5', // Get this from WalletConnect dashboard
          //   metadata: {
          //     name: 'KyberSwap',
          //     description: 'Multi-chain DeFi Hub',
          //     url: 'https://kyberswap.com',
          //     icons: ['https://kyberswap.com/favicon.ico'],
          //   },
          // }),
        ],
      })

      const modal = setupModal(selector, {
        contractId: '', // Optional, demonstrates passing a contract ID
      })

      const state = selector.store.getState()
      setAccounts(state.accounts)

      // Set up the wallet selector and modal
      setSelector(selector)
      setModal(modal)

      // Subscribe to wallet changes
      const subscription = selector.store.observable.subscribe((state: any) => {
        setAccounts(state.accounts)

        // Update wallet state when accounts change
        if (state.accounts.length > 0) {
          const accountId = state.accounts[0].accountId
          // Get the wallet type
          const selectedWalletId = selector.store.getState().selectedWalletId

          setWalletState({
            ...walletState,
            isConnected: true,
            accountId,
            selectedWalletId,
          })

          // Get account balance
          fetchBalance(accountId)
        } else {
          setWalletState({
            ...walletState,
            isConnected: false,
            accountId: null,
            balance: null,
            selectedWalletId: null,
          })
        }
      })

      return () => subscription.unsubscribe()
    }

    init().catch(err => console.error(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch account balance
  const fetchBalance = async (accountId: string) => {
    if (!selector || !accountId) return

    try {
      const wallet = await selector.wallet()
      const provider = wallet.getProvider()

      // Use the provider to get account balance
      const balanceResult = await provider.query({
        request_type: 'view_account',
        finality: 'final',
        account_id: accountId,
      })

      // Convert yoctoNEAR to NEAR
      const balanceInNear = utils.format.formatNearAmount(balanceResult.amount || '0')

      setWalletState(prev => ({
        ...prev,
        balance: balanceInNear,
      }))
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }
  console.log(walletState)

  // Connect to NEAR wallet
  const connect = async () => {
    if (!selector) return

    // Open modal to select a wallet
    modal.show()
  }

  // Disconnect from NEAR wallet
  const disconnect = async () => {
    if (!selector || !walletState.selectedWalletId) return

    try {
      const wallet = await selector.wallet(walletState.selectedWalletId)
      await wallet.signOut()

      // Reset wallet state
      setWalletState({
        isConnected: false,
        accountId: null,
        balance: null,
        selectedWalletId: null,
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }

    return Promise.resolve()
  }

  // Open the wallet selector modal
  const openModal = () => {
    if (modal) {
      modal.show()
    }
  }

  // Sign and send a transaction
  const signAndSendTransaction = async (options: TransactionOptions): Promise<string | null> => {
    if (!selector || !walletState.isConnected || !walletState.accountId) {
      throw new Error('Not connected to NEAR wallet')
    }

    try {
      const { contractId, methodName, args = {}, gas = '100000000000000', deposit = '0' } = options

      const wallet = await selector.wallet()

      // Sign and send transaction
      const outcome = await wallet.signAndSendTransaction({
        receiverId: contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName,
              args,
              gas,
              deposit,
            },
          },
        ],
      })

      return outcome?.transaction_outcome?.id || null
    } catch (error) {
      console.error('Error signing and sending transaction:', error)
      return null
    }
  }

  // Send NEAR tokens to another account
  const sendTokens = async (receiverId: string, amount: string): Promise<string | null> => {
    if (!selector || !walletState.isConnected || !walletState.accountId) {
      throw new Error('Not connected to NEAR wallet')
    }

    try {
      // Convert NEAR amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const amountInYocto = utils.format.parseNearAmount(amount)

      if (!amountInYocto) {
        throw new Error('Invalid amount')
      }

      const wallet = await selector.wallet()

      // Send tokens
      const outcome = await wallet.signAndSendTransaction({
        receiverId,
        actions: [
          {
            type: 'Transfer',
            params: {
              deposit: amountInYocto,
            },
          },
        ],
      })

      return outcome?.transaction_outcome?.id || null
    } catch (error) {
      console.error('Error sending tokens:', error)
      return null
    }
  }

  // Sign a message (only supported by specific wallets)
  const signMessage = async (message: string): Promise<string | null> => {
    if (!selector || !walletState.isConnected || !walletState.accountId) {
      throw new Error('Not connected to NEAR wallet')
    }

    try {
      const wallet = await selector.wallet()

      // Check if wallet supports message signing
      if (!wallet.signMessage) {
        throw new Error('Wallet does not support message signing')
      }

      // Sign message
      const result = await wallet.signMessage({
        message: new TextEncoder().encode(message),
        recipient: walletState.accountId,
      })

      return result.signature
    } catch (error) {
      console.error('Error signing message:', error)
      return null
    }
  }

  return (
    <NEARWalletContext.Provider
      value={{
        connect,
        disconnect,
        walletState,
        signAndSendTransaction,
        sendTokens,
        signMessage,
        openModal,
        accounts,
      }}
    >
      {children}
    </NEARWalletContext.Provider>
  )
}

// Custom hook to use the NEAR wallet
export function useNEARWallet() {
  const context = useContext(NEARWalletContext)
  if (context === undefined) {
    throw new Error('useNEARWallet must be used within a NEARWalletProvider')
  }
  return context
}
