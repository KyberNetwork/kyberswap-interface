import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import blackjackApi from 'services/blackjack'

import { MOCK_ACCOUNT_EVM } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { useAccount } from 'hooks/useAccount'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useEthersProvider } from 'hooks/useEthersProvider'
import store, { AppState } from 'state'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  networkInfo: NetworkInfo
  isWrongNetwork: boolean
  walletKey: string
} {
  const [searchParams] = useSearchParams()
  const rawChainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const isWrongNetwork = !isSupportedChainId(rawChainIdState)
  const { connector } = useAccount()
  const chainIdState = isWrongNetwork ? ChainId.MAINNET : rawChainIdState

  /**Hook for EVM infos */
  const { account: evmAccount } = useWeb3React()

  const address = evmAccount ?? undefined
  const mockAccountParam = searchParams.get('account')
  const account = mockAccountParam || MOCK_ACCOUNT_EVM || address

  const walletKey = connector?.id ?? ''

  return {
    chainId: chainIdState,
    account,
    networkInfo: NETWORKS_INFO[chainIdState],
    isWrongNetwork,
    walletKey,
  }
}

export function useWeb3React() {
  const account = useAccount()
  const kyberChainId = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const provider = useEthersProvider({ chainId: account.chainId })

  const latestChainIdRef = useRef(account.chainId)

  useEffect(() => {
    latestChainIdRef.current = account.chainId
  }, [account.chainId])

  const wrappedProvider = useMemo(
    () =>
      provider
        ? new Proxy(provider, {
            get(target, prop) {
              if (prop === 'send') {
                return async (...params: any[]) => {
                  if (params[0] === 'eth_chainId') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    return target[prop](...params)
                  }

                  if (kyberChainId !== account.chainId) {
                    throw new Error(
                      'Your chain is mismatched, please make sure your wallet is switch to the expected chain.',
                    )
                  }

                  const res = await store.dispatch(
                    blackjackApi.endpoints.checkBlackjack.initiate(account.address || ''),
                  )
                  if (res?.data?.blacklisted) throw new Error('There was an error with your transaction.')

                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  return target[prop](...params)
                }
              }
              return target[prop as unknown as keyof Web3Provider]
            },
          })
        : provider,
    [account.chainId, account.address, kyberChainId, provider],
  )

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId,
      provider: wrappedProvider,
      library: wrappedProvider,
      connector: account.connector,
      active: account.address !== undefined,
    }),
    [account.address, account.chainId, account.connector, wrappedProvider],
  )
}
