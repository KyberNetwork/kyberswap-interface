import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import blackjackApi from 'services/blackjack'

import { blocto, coinbaseWallet, gnosisSafe, krystalWalletConnectV2, walletConnectV2 } from 'constants/connectors'
import { MOCK_ACCOUNT_EVM } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import store, { AppState } from 'state'
import { detectInjectedType } from 'utils'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  walletKey: SUPPORTED_WALLET | undefined
  wallet: { isConnected: boolean; walletKey?: SUPPORTED_WALLET; connector?: Connector; chainId?: ChainId }
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

  const address = evmAccount ?? undefined
  const mockAccountParam = searchParams.get('account')
  const account = mockAccountParam || MOCK_ACCOUNT_EVM || address

  const walletKey = useMemo(() => {
    if (!isConnectedEVM) return undefined
    if (connectedConnectorEVM === walletConnectV2) {
      return 'WALLET_CONNECT'
    }
    if (connectedConnectorEVM === krystalWalletConnectV2) {
      return 'KRYSTAL_WC'
    }
    if (connectedConnectorEVM === gnosisSafe) {
      return 'SAFE'
    }
    if (connectedConnectorEVM === blocto) {
      return 'BLOCTO'
    }
    if (connectedConnectorEVM === coinbaseWallet) {
      return 'COINBASE'
    }
    const detectedWallet = detectInjectedType()

    return (
      detectedWallet ??
      (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
        const walletItem = SUPPORTED_WALLETS[walletKey]
        return isConnectedEVM && walletItem.connector === connectedConnectorEVM
      })
    )
  }, [connectedConnectorEVM, isConnectedEVM])

  return {
    chainId: chainIdState,
    account,
    walletKey,
    wallet: useMemo(() => {
      return {
        isConnected: isConnectedEVM,
        connector: connectedConnectorEVM,
        walletKey,
        chainId: chainIdEVM,
      }
    }, [isConnectedEVM, connectedConnectorEVM, walletKey, chainIdEVM]),
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

const wrapProvider = (provider: Web3Provider, account: string): Web3Provider =>
  new Proxy(provider, {
    get(target, prop) {
      if (prop === 'send') {
        return async (...params: any[]) => {
          if (params[0] === 'eth_chainId') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return target[prop](...params)
          }

          const res = await store.dispatch(blackjackApi.endpoints.checkBlackjack.initiate(account))
          if (res?.data?.blacklisted) throw new Error('There was an error with your transaction.')

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return target[prop](...params)
        }
      }
      return target[prop as unknown as keyof Web3Provider]
    },
  })
const cacheProvider = new WeakMap<Web3Provider, Web3Provider>()
const useWrappedProvider = () => {
  const { provider, account } = useWeb3ReactCore<Web3Provider>()

  if (!provider) return undefined
  let wrappedProvider = cacheProvider.get(provider)
  if (!wrappedProvider) {
    wrappedProvider = account ? wrapProvider(provider, account) : provider
    cacheProvider.set(provider, wrappedProvider)
  }
  return wrappedProvider
}

export function useWeb3React(): Web3React {
  const { connector, chainId, account, isActive: active } = useWeb3ReactCore<Web3Provider>()
  const provider = useWrappedProvider()

  return {
    connector,
    library: provider,
    chainId,
    account,
    active,
  }
}
