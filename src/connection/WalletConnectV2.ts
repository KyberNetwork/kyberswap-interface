import { ChainId } from '@kyberswap/ks-sdk-core'
import { OPTIONAL_EVENTS } from '@walletconnect/ethereum-provider'
import { WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect-v2'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import {
  NETWORKS_INFO,
  WALLET_CONNECT_OPTIONAL_CHAIN_IDS,
  WALLET_CONNECT_REQUIRED_CHAIN_IDS,
  WALLET_CONNECT_SUPPORTED_CHAIN_IDS,
} from 'constants/networks'

export const walletConnectOption = {
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: WALLET_CONNECT_REQUIRED_CHAIN_IDS,
  optionalChains: WALLET_CONNECT_OPTIONAL_CHAIN_IDS,
  optionalEvents: OPTIONAL_EVENTS,
  methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
  optionalMethods: ['eth_signTypedData', 'eth_sign'],

  metadata: {
    name: 'KyberSwap',
    description: document.title,
    url: window.location.origin,
    icons: ['https://kyberswap.com/favicon.svg'],
  },
  showQrModal: true,
  rpcMap: WALLET_CONNECT_SUPPORTED_CHAIN_IDS.reduce((acc, cur) => {
    acc[cur] = NETWORKS_INFO[cur].defaultRpcUrl
    return acc
  }, {} as { [key in ChainId]: string }),

  qrModalOptions: {
    chainImages: undefined,
    themeMode: 'dark' as const,
    themeVariables: {
      '--w3m-z-index': '1000',
      '--w3m-logo-image-url': Kyber,
      '--w3m-background-image-url': WC_BG,
      '--w3m-accent-color': '#31CB9E',
      '--w3m-accent-fill-color': '#222222',
      '--w3m-color-bg-1': '#0F0F0F',
    } as any,
  },
}

export class WalletConnectV2 extends WalletConnect {
  constructor({ actions, onError }: Omit<WalletConnectConstructorArgs, 'options'>) {
    super({
      actions,
      options: walletConnectOption,
      onError,
    })
  }

  activate(chainId?: number) {
    return super.activate(chainId)
  }
}
