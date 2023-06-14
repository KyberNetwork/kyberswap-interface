import { Web3Provider } from '@ethersproject/providers'
import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'
import { Wallet, useWallet } from '@solana/wallet-adapter-react'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { coinbaseWallet, metaMask, walletConnectV2 } from 'connectors'
import { MOCK_ACCOUNT_EVM, MOCK_ACCOUNT_SOLANA } from 'constants/env'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { AppState } from 'state'
import { useKyberSwapConfig } from 'state/application/hooks'
import { detectInjectedType, isEVMWallet, isSolanaWallet } from 'utils'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  walletKey: SUPPORTED_WALLET | undefined
  walletEVM: { isConnected: boolean; walletKey?: SUPPORTED_WALLET; connector?: Connector; chainId?: ChainId }
  walletSolana: { isConnected: boolean; walletKey?: SUPPORTED_WALLET; wallet: Wallet | null }
  isEVM: boolean
  isSolana: boolean
  networkInfo: NetworkInfo
  isWrongNetwork: boolean
} {
  const [searchParams] = useSearchParams()
  const rawChainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const isWrongNetwork = !isSupportedChainId(rawChainIdState)
  const chainIdState = isWrongNetwork ? ChainId.MAINNET : rawChainIdState

  /**Hook for EVM infos */
  const {
    connector: connectedConnectorEVM,
    active: isConnectedEVM,
    account: evmAccount,
    chainId: chainIdEVM,
  } = useWeb3React()
  /**Hook for Solana infos */
  const { wallet: connectedWalletSolana, connected: isConnectedSolana, publicKey } = useWallet()

  const isEVM = useMemo(() => getChainType(chainIdState) === ChainType.EVM, [chainIdState])
  const isSolana = useMemo(() => getChainType(chainIdState) === ChainType.SOLANA, [chainIdState])

  const addressEVM = evmAccount ?? undefined
  const addressSolana = publicKey?.toBase58()
  const mockAccountParam = searchParams.get('account')
  const account =
    isEVM && addressEVM
      ? mockAccountParam || MOCK_ACCOUNT_EVM || addressEVM
      : isSolana && addressSolana
      ? mockAccountParam || MOCK_ACCOUNT_SOLANA || addressSolana
      : undefined

  const walletKeyEVM = useMemo(() => {
    if (!isConnectedEVM) return undefined
    const detectedWallet = detectInjectedType()
    if (
      detectedWallet !== 'COINBASE' &&
      (connectedConnectorEVM === coinbaseWallet || !!(connectedConnectorEVM as any)?.walletLink)
    ) {
      return 'COINBASE_LINK'
    }
    if (connectedConnectorEVM === walletConnectV2) {
      return 'WALLET_CONNECT'
    }
    return (
      detectedWallet ??
      (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
        const wallet = SUPPORTED_WALLETS[walletKey]
        return isEVMWallet(wallet) && isConnectedEVM && wallet.connector === connectedConnectorEVM
      })
    )
  }, [connectedConnectorEVM, isConnectedEVM])

  const walletKeySolana = useMemo(
    () =>
      isConnectedSolana
        ? (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
            const wallet = SUPPORTED_WALLETS[walletKey]
            return isSolanaWallet(wallet) && wallet.adapter === connectedWalletSolana?.adapter
          })
        : undefined,
    [isConnectedSolana, connectedWalletSolana?.adapter],
  )
  return {
    chainId: chainIdState,
    account,
    walletKey: isEVM ? walletKeyEVM : walletKeySolana,
    walletEVM: useMemo(() => {
      return {
        isConnected: isConnectedEVM,
        connector: connectedConnectorEVM,
        walletKey: walletKeyEVM,
        chainId: chainIdEVM,
      }
    }, [isConnectedEVM, connectedConnectorEVM, walletKeyEVM, chainIdEVM]),
    walletSolana: useMemo(() => {
      return {
        isConnected: isConnectedSolana,
        wallet: connectedWalletSolana,
        walletKey: walletKeySolana,
      }
    }, [isConnectedSolana, connectedWalletSolana, walletKeySolana]),
    isEVM: isEVM,
    isSolana: isSolana,
    networkInfo: NETWORKS_INFO[chainIdState],
    isWrongNetwork,
  }
}

type Web3React = {
  connector: Connector
  library: Web3Provider | undefined
  chainId: number | undefined
  account: string | undefined
  active: boolean
}

export function useWeb3React(): Web3React {
  const { connector, chainId, account, isActive: active, provider } = useWeb3ReactCore<Web3Provider>()
  return {
    connector,
    library: provider,
    chainId,
    account,
    active,
  }
}

export const useWeb3Solana = () => {
  const { connection } = useKyberSwapConfig()
  return { connection }
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network they're on
 */
export function useInactiveListener(suppress = false) {
  const { isEVM } = useActiveWeb3React()
  const { active } = useWeb3React() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window
    if (isEVM && ethereum?.on && !active && !suppress) {
      const handleChainChanged = () => {
        // eat errors
        metaMask.activate().catch(error => {
          console.error('Failed to activate after chain changed', error)
        })
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // eat errors
          metaMask.activate().catch(error => {
            console.error('Failed to activate after accounts changed', error)
          })
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [active, suppress, isEVM])
}
