import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnection } from 'connection'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import blackjackApi from 'services/blackjack'

import { MOCK_ACCOUNT_EVM } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import store, { AppState } from 'state'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  walletKey: string | undefined
  networkInfo: NetworkInfo
  isWrongNetwork: boolean
} {
  const [searchParams] = useSearchParams()
  const rawChainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const isWrongNetwork = !isSupportedChainId(rawChainIdState)
  const chainIdState = isWrongNetwork ? ChainId.MAINNET : rawChainIdState
  /**Hook for EVM infos */
  const { connector: connectedConnectorEVM, account: evmAccount } = useWeb3React()

  const walletKey = getConnection(connectedConnectorEVM).getProviderInfo().name

  const address = evmAccount ?? undefined
  const mockAccountParam = searchParams.get('account')
  const account = mockAccountParam || MOCK_ACCOUNT_EVM || address

  return {
    chainId: chainIdState,
    account,
    walletKey,
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

const wrapProvider = (provider: Web3Provider, account: string, wrongChain = false): Web3Provider =>
  new Proxy(provider, {
    get(target, prop) {
      if (prop === 'send') {
        return async (...params: any[]) => {
          if (params[0] === 'eth_chainId') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return target[prop](...params)
          }
          if (wrongChain)
            throw new Error('Chain is mismatched. Please make sure your wallet is switched to expected chain')

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
  const kyberChainId = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const { provider, account, chainId } = useWeb3ReactCore<Web3Provider>()

  if (!provider) return undefined
  let wrappedProvider = cacheProvider.get(provider)
  if (chainId !== kyberChainId) {
    wrappedProvider = account ? wrapProvider(provider, account, true) : provider
  } else if (!wrappedProvider) {
    wrappedProvider = account ? wrapProvider(provider, account, false) : provider
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
