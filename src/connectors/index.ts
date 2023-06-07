import { ChainId } from '@kyberswap/ks-sdk-core'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'

import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import { NETWORKS_INFO, SUPPORTED_NETWORKS, WALLET_CONNECT_SUPPORTED_CHAIN_IDS } from 'constants/networks'

export const [metaMask, metamaskHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [coin98, coin98Hooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [brave, braveHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [trustWallet, trustWalletHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))

export const [walletConnectV2, walletConnectV2Hooks] = initializeConnector<WalletConnectV2>(
  actions =>
    new WalletConnectV2({
      actions,
      defaultChainId: ChainId.MAINNET,
      options: {
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: WALLET_CONNECT_SUPPORTED_CHAIN_IDS,
        // optionalChains,
        showQrModal: true,
        rpcMap: SUPPORTED_NETWORKS.reduce((acc, cur) => {
          acc[cur] = NETWORKS_INFO[cur].defaultRpcUrl
          return acc
        }, {} as { [key in ChainId]: string }),
        qrModalOptions: {
          themeVariables: {
            '--w3m-z-index': '1000',
          },
        },
      },
    }),
)

export const [coinbaseWallet, coinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  actions =>
    new CoinbaseWallet({
      actions,
      options: {
        url: NETWORKS_INFO[ChainId.MAINNET].defaultRpcUrl,
        appName: 'kyberswap',
      },
    }),
)
