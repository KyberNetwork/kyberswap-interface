import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { useAccount as useAccountWagmi } from 'wagmi'

import { SMART_WALLETS } from 'components/Web3Provider'
import { MOCK_ACCOUNT_EVM } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { useAccount } from 'hooks/useAccount'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { AppState } from 'state'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { isInSafeApp } from 'utils'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  networkInfo: NetworkInfo
  isWrongNetwork: boolean
  walletKey: string
} {
  const [searchParams] = useSearchParams()
  const rawChainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const { chainId } = useAccountWagmi()
  const isWrongNetwork = !!chainId && !isSupportedChainId(chainId)
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
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const disconnect = useDisconnectWallet()
  useEffect(() => {
    // disconnect if the user is not accepted terms, dont apply to safe app
    if (account.connector && !isAcceptedTerm && !isInSafeApp) {
      disconnect()
    }
  }, [isAcceptedTerm, account.connector, disconnect])

  return useMemo(
    () => ({
      account: '0x0193a8a52D77E27bDd4f12E0cDd52d8Ff1d97d68',
      chainId: account.chainId,
      connector: account.connector,
      active: account.address !== undefined,
      isSmartConnector: SMART_WALLETS.includes(account.connector?.id),
    }),
    [account.address, account.chainId, account.connector],
  )
}
