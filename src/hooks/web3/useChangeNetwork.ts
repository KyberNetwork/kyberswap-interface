import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { walletConnectV2 } from 'constants/connectors/evm'
import { didUserReject } from 'constants/connectors/utils'
import { NETWORKS_INFO, isEVM, isSolana } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { friendlyError } from 'utils/errorMessage'
import { wait } from 'utils/retry'

import { useLazyKyberswapConfig } from '../useKyberSwapConfig'

let latestChainId: ChainId
export function useChangeNetwork() {
  const { chainId, walletEVM, walletSolana, isWrongNetwork } = useActiveWeb3React()
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
      /** although change chain successfully, but it take 1-2s for chainId has a new value | update: or never change chain but still return success, e.g: safe, phantom evm
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
      desiredChainId: ChainId,
      error: any,
      customFailureCallback?: (error: Error) => void,
      customTexts?: {
        name?: string
        title?: string
        rejected?: string
        default?: string
      },
    ) => {
      const title = customTexts?.title || t`Failed to switch network`
      let message: string = customTexts?.default || t`Error when changing network.`

      if (didUserReject(error)) {
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
        const e = new Error(`[Activate chain] ${walletEVM.walletKey} ${message}`)
        e.name = 'Activate chain error'
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
      customFailureCallback?.(error)
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
      customFailureCallback?: (error: Error) => void,
      waitUtilUpdatedChainId = false,
    ) => {
      const wrappedSuccessCallback = () => {
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)
      }

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

      enum Solution {
        web3_react = 'web3_react',
        provider_request = 'provider_request',
      }
      const solutions = {
        [Solution.web3_react]: async () => await connector.activate(addChainParameter),
        [Solution.provider_request]: async () => {
          const activeProvider = library?.provider ?? window.ethereum
          if (activeProvider?.request) {
            await activeProvider.request({
              method: 'wallet_addEthereumChain',
              params: [addChainParameter],
            })
          } else {
            throw new Error('empty request function')
          }
        },
      }

      const solutionPrefer: readonly Solution[] = (() => {
        if (walletEVM.walletKey === 'KRYSTAL') {
          // Krystal break when call by web3-react .activate
          return [Solution.provider_request]
        } else if (walletEVM.walletKey === 'BLOCTO') {
          // Blocto break when call by provider.request
          return [Solution.web3_react]
        }
        return [Solution.provider_request, Solution.web3_react]
      })()

      const errors: Error[] = []
      for (let i = 0; i < solutionPrefer.length; i++) {
        try {
          console.info('[Add network] start:', {
            wallet: walletEVM.walletKey,
            solution: solutionPrefer[i],
            addChainParameter,
          })
          await solutions[solutionPrefer[i]]()
          console.info('[Add network] success:', {
            wallet: walletEVM.walletKey,
            solution: solutionPrefer[i],
            addChainParameter,
          })
          wrappedSuccessCallback()
          return
        } catch (error) {
          console.error(
            '[Add network] error:',
            JSON.stringify(
              {
                wallet: walletEVM.walletKey,
                desiredChainId,
                solution: solutionPrefer[i],
                message: friendlyError(error),
                error,
                addChainParameter,
                didUserReject: didUserReject(error),
              },
              null,
              2,
            ),
          )

          if (didUserReject(error)) {
            failureCallback(desiredChainId, error, customFailureCallback, customTexts)
            return
          }
          errors.push(error)
        }
      }

      failureCallback(desiredChainId, errors.at(-1), customFailureCallback, customTexts)
      const e = new Error(`[Add network] ${walletEVM.walletKey} ${friendlyError(errors.at(-1) || '')}`)
      e.name = 'Add new network Error'
      e.stack = ''
      captureException(e, {
        level: 'error',
        extra: {
          wallet: walletEVM.walletKey,
          desiredChainId,
          addChainParameter,
          friendlyMessages: errors.map(friendlyError),
          errors,
        },
      })
    },
    [library?.provider, failureCallback, fetchKyberswapConfig, successCallback, walletEVM.walletKey, connector],
  )

  const changeNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      customSuccessCallback?: () => void,
      customFailureCallback?: (error: Error) => void,
      waitUtilUpdatedChainId = false, //todo: force all to true
      isAddNetworkIfPossible = true,
    ) => {
      const wrappedSuccessCallback = () =>
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)
      // if connected, nothing todo, success return
      if (desiredChainId === chainId && !isWrongNetwork) {
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
          console.info('[Switch network] start:', { desiredChainId })
          await connector.activate(desiredChainId)
          console.info('[Switch network] success:', { desiredChainId })
          changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
        } catch (error) {
          console.error(
            '[Switch network] error:',
            JSON.stringify({ desiredChainId, error, didUserReject: didUserReject(error) }, null, 2),
          )

          // walletconnect v2 not support add network, so halt execution here
          if (didUserReject(error) || connector === walletConnectV2) {
            failureCallback(desiredChainId, error, customFailureCallback)
            return
          }
          if (isAddNetworkIfPossible) {
            addNewNetwork(
              desiredChainId,
              undefined,
              undefined,
              () =>
                changeNetwork(
                  desiredChainId,
                  customSuccessCallback,
                  customFailureCallback,
                  waitUtilUpdatedChainId,
                  false,
                ),
              customFailureCallback,
              waitUtilUpdatedChainId,
            )
          } else {
            failureCallback(desiredChainId, error, customFailureCallback)
          }
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
