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
  const { connector, library } = useWeb3React()
  const fetchKyberswapConfig = useLazyKyberswapConfig()

  const dispatch = useAppDispatch()
  const notify = useNotify()
  latestChainId = chainId

  const changeNetworkHandler = useCallback(
    (desiredChainId: ChainId, successCallback?: () => void) => {
      dispatch(updateChainId(desiredChainId))
      successCallback?.()
    },
    [dispatch],
  )

  const successCallback = useCallback(
    async (desiredChainId: ChainId, waitUtilUpdatedChainId: boolean, customSuccessCallback?: () => void) => {
      const initialChainId = latestChainId
      /** although change chain successfully, but it take 1-2s for chainId has a new value
       * => this option will wait util chainId has actually update to new value to prevent some edge case
       */
      while (waitUtilUpdatedChainId) {
        await wait(300)
        if (desiredChainId === latestChainId) {
          customSuccessCallback?.()
          return
        }
        if (initialChainId !== latestChainId) {
          return
        }
      }
      customSuccessCallback?.()
    },
    [],
  )

  const failureCallback = useCallback(
    (
      connector: Connector,
      desiredChainId: ChainId,
      error: any,
      customFailureCallback?: (connector: Connector, error: Error) => void,
      customTexts?: {
        name?: string
        title?: string
        rejected?: string
        default?: string
      },
    ) => {
      const title = customTexts?.title || t`Failed to switch network`
      let message: string = customTexts?.default || t`Error when changing network.`

      if (didUserReject(connector, error)) {
        message =
          customTexts?.rejected ||
          t`In order to use KyberSwap on ${
            customTexts?.name || NETWORKS_INFO[desiredChainId].name
          }, you must accept the network in your wallet.`
      } else if (
        [
          /Cannot activate an optional chain \(\d+\), as the wallet is not connected to it\./,
          /Chain 'eip155:\d+' not approved. Please use one of the following: eip155:\d+/,
        ].some(regex => regex.test(error?.message))
      ) {
        message = t`Your wallet not support chain ${NETWORKS_INFO[desiredChainId].name}`
      } else {
        message = error?.message || message
        const e = new Error(`[Wallet] ${error.message}`)
        e.name = 'Activate chain fail'
        e.stack = ''
        captureException(e, {
          level: 'warning',
          extra: { error, wallet: walletEVM.walletKey, chainId, desiredChainId, message },
        })
      }
      notify({
        title,
        type: NotificationType.ERROR,
        summary: message,
      })
      customFailureCallback?.(connector, error)
    },
    [chainId, notify, walletEVM.walletKey],
  )

  const addNewNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      customRpc?: string,
      customTexts?: {
        name?: string
        title?: string
        rejected?: string
        default?: string
      },
      customSuccessCallback?: () => void,
      customFailureCallback?: (connector: Connector, error: Error) => void,
      waitUtilUpdatedChainId = false,
    ) => {
      const wrappedSuccessCallback = () =>
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)

      const { rpc } = customRpc ? { rpc: customRpc } : await fetchKyberswapConfig(desiredChainId)
      const addChainParameter = {
        chainId: '0x' + desiredChainId.toString(16),
        rpcUrls: [rpc],
        chainName: customTexts?.name || NETWORKS_INFO[desiredChainId].name,
        nativeCurrency: {
          name: NETWORKS_INFO[desiredChainId].nativeToken.name,
          symbol: NETWORKS_INFO[desiredChainId].nativeToken.symbol,
          decimals: NETWORKS_INFO[desiredChainId].nativeToken.decimal,
        },
        blockExplorerUrls: [NETWORKS_INFO[desiredChainId].etherscanUrl],
      }
      console.info('Add new network', { addChainParameter })
      const activeProvider = library?.provider ?? window.ethereum
      if (activeProvider && activeProvider.request) {
        try {
          await activeProvider.request({
            method: 'wallet_addEthereumChain',
            params: [addChainParameter],
          })
          changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
        } catch (error) {
          console.error('Add new network failed', { addChainParameter, error })
          failureCallback(connector, desiredChainId, error, customFailureCallback, customTexts)
          if (!didUserReject(connector, error)) {
            const e = new Error(`[Wallet] ${error.message}`)
            e.name = 'Add new network Error'
            e.stack = ''
            captureException(e, {
              level: 'warning',
              extra: { error, wallet: walletEVM.walletKey, chainId, addChainParameter },
            })
          }
        }
      }
    },
    [
      library?.provider,
      chainId,
      changeNetworkHandler,
      connector,
      failureCallback,
      fetchKyberswapConfig,
      successCallback,
      walletEVM.walletKey,
    ],
  )

  const changeNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      customSuccessCallback?: () => void,
      customFailureCallback?: (connector: Connector, error: Error) => void,
      waitUtilUpdatedChainId = false,
    ) => {
      const wrappedSuccessCallback = () =>
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)
      // if connected, nothing todo, success return
      if (desiredChainId === chainId) {
        customSuccessCallback?.()
        return
      }

      // if changing to network not connected wallet, update redux and success return
      if (
        (isSolana(desiredChainId) && !walletSolana.isConnected) ||
        (isEVM(desiredChainId) && !walletEVM.isConnected)
      ) {
        changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
        return
      }

      if (isEVM(desiredChainId)) {
        try {
          console.info('Switch network', { desiredChainId })
          await connector.activate(desiredChainId)
          console.info('Switch network success', { desiredChainId })
          changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
        } catch (error) {
          console.error('Switch network failed', { desiredChainId, error })

          // walletconnect v2 not support add network, so halt execution here
          if (didUserReject(connector, error) || connector === walletConnectV2) {
            failureCallback(connector, desiredChainId, error, customFailureCallback)
            return
          }

          addNewNetwork(
            desiredChainId,
            undefined,
            undefined,
            customSuccessCallback,
            customFailureCallback,
            waitUtilUpdatedChainId,
          )
        }
      } else {
        changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
      }
    },
    [
      chainId,
      walletSolana.isConnected,
      walletEVM.isConnected,
      connector,
      changeNetworkHandler,
      successCallback,
      failureCallback,
      addNewNetwork,
    ],
  )

  return { changeNetwork, addNewNetwork }
}
