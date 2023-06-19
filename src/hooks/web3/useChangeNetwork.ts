import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { Connector } from '@web3-react/types'
import { useCallback } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { walletConnectV2 } from 'constants/connectors/evm'
import { didUserReject } from 'constants/connectors/utils'
import { NETWORKS_INFO, isEVM, isSolana } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { wait } from 'utils/retry'

import { useLazyKyberswapConfig } from '../useKyberSwapConfig'

let latestChainId: ChainId
export function useChangeNetwork() {
  const { chainId, walletEVM, walletSolana } = useActiveWeb3React()
  const { connector } = useWeb3React()
  const fetchKyberswapConfig = useLazyKyberswapConfig()

  const dispatch = useAppDispatch()
  const notify = useNotify()

  const changeNetworkHandler = useCallback(
    (desiredChainId: ChainId, successCallback?: () => void) => {
      dispatch(updateChainId(desiredChainId))
      successCallback?.()
    },
    [dispatch],
  )

  latestChainId = chainId
  const changeNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      successCb?: () => void,
      failureCallback?: () => void,
      waitUtilUpdatedChainId = false,
    ) => {
      // if connected, nothing todo, success return
      if (desiredChainId === chainId) {
        successCb?.()
        return
      }

      const successCallback = async () => {
        /** although change chain successfully, but it take 1-2s for chainId has a new value
         * => this option will wait util chainId has actually update to new value to prevent some edge case
         */
        while (waitUtilUpdatedChainId) {
          await wait(1000)
          if (desiredChainId === latestChainId) break
        }
        successCb?.()
      }

      // if changing to network not connected wallet, update redux and success return
      if (
        (isSolana(desiredChainId) && !walletSolana.isConnected) ||
        (isEVM(desiredChainId) && !walletEVM.isConnected)
      ) {
        changeNetworkHandler(desiredChainId, successCallback)
        return
      }

      if (isEVM(desiredChainId)) {
        try {
          await connector.activate(desiredChainId)
          changeNetworkHandler(desiredChainId, successCallback)
        } catch (error) {
          const notifyFailed = (connector: Connector, error: any) => {
            let message: string = t`Error when changing network.`

            if (didUserReject(connector, error)) {
              message = t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must accept the network in your wallet.`
            } else if (
              [
                /Cannot activate an optional chain \(\d+\), as the wallet is not connected to it\./,
                /Chain 'eip155:\d+' not approved. Please use one of the following: eip155:\d+/,
              ].some(regex => regex.test(error?.message))
            ) {
              message = t`Your wallet not support chain ${NETWORKS_INFO[desiredChainId].name}`
            } else {
              const e = new Error(`[Wallet] ${error.message}`)
              e.name = 'Change chain step 1 Error'
              e.stack = ''
              captureException(e, {
                level: 'warning',
                extra: { error, wallet: walletEVM.walletKey, chainId, desiredChainId },
              })
              message = error?.message || message
            }
            notify({
              title: t`Failed to switch network`,
              type: NotificationType.ERROR,
              summary: message,
            })
            failureCallback?.()
          }
          // walletconnect v2 not support add network, so halt execution here
          if (didUserReject(connector, error) || connector === walletConnectV2) {
            notifyFailed(connector, error)
            return
          }
          console.error(`Change network step 1: activate chainID ${desiredChainId} failed`, { error })
          const { rpc } = await fetchKyberswapConfig(desiredChainId)
          const addChainParameter = {
            chainId: desiredChainId,
            rpcUrls: [rpc],
            chainName: NETWORKS_INFO[desiredChainId].name,
            nativeCurrency: {
              name: NETWORKS_INFO[desiredChainId].nativeToken.name,
              symbol: NETWORKS_INFO[desiredChainId].nativeToken.symbol,
              decimals: NETWORKS_INFO[desiredChainId].nativeToken.decimal,
            },
            blockExplorerUrls: [NETWORKS_INFO[desiredChainId].etherscanUrl],
          }
          try {
            await connector.activate(addChainParameter)
            changeNetworkHandler(desiredChainId, successCallback)
          } catch (error) {
            notifyFailed(connector, error)
            if (!didUserReject(connector, error)) {
              const e = new Error(`[Wallet] ${error.message}`)
              e.name = 'Change chain step 2 Error'
              e.stack = ''
              captureException(e, {
                level: 'warning',
                extra: { error, wallet: walletEVM.walletKey, chainId, addChainParameter },
              })
              console.error(`Change network step 2: activate addChainParameter ${addChainParameter} failed`, { error })
            }
          }
        }
      } else {
        changeNetworkHandler(desiredChainId, successCallback)
      }
    },
    [
      chainId,
      walletSolana.isConnected,
      walletEVM.isConnected,
      walletEVM.walletKey,
      changeNetworkHandler,
      connector,
      fetchKyberswapConfig,
      notify,
    ],
  )

  return changeNetwork
}
