import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { didUserReject } from 'connectors/utils'
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
          const notifyFailed = () => {
            notify({
              title: t`Failed to switch network`,
              type: NotificationType.ERROR,
              summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must accept the network in your wallet.`,
            })
            failureCallback?.()
          }
          if (didUserReject(connector, error)) {
            notifyFailed()
            return
          }
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
            if (didUserReject(connector, error)) {
              notifyFailed()
            }
          }
        }
      } else {
        changeNetworkHandler(desiredChainId, successCallback)
      }
    },
    [
      connector,
      notify,
      changeNetworkHandler,
      walletEVM.isConnected,
      walletSolana.isConnected,
      chainId,
      fetchKyberswapConfig,
    ],
  )

  return changeNetwork
}
