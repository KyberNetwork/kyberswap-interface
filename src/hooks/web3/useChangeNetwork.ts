import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { useCallback } from 'react'
import { useSwitchChain } from 'wagmi'

import { NotificationType } from 'components/Announcement/type'
import { didUserReject } from 'constants/connectors/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { friendlyError } from 'utils/errorMessage'
import { wait } from 'utils/retry'

//import { useLazyKyberswapConfig } from '../useKyberSwapConfig'

let latestChainId: number | undefined
export function useChangeNetwork() {
  const { isWrongNetwork, chainId: kyberChainId } = useActiveWeb3React()
  const { chainId, connector, active, library } = useWeb3React()
  //const fetchKyberswapConfig = useLazyKyberswapConfig()

  const dispatch = useAppDispatch()
  const notify = useNotify()
  latestChainId = chainId

  const { switchChain } = useSwitchChain()

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
        const name = customTexts?.name || NETWORKS_INFO[desiredChainId].name
        message =
          customTexts?.rejected || t`In order to use KyberSwap on ${name}, you must accept the network in your wallet.`
      } else if (
        [
          /Cannot activate an optional chain \(\d+\), as the wallet is not connected to it\./,
          /Chain 'eip155:\d+' not approved. Please use one of the following: eip155:\d+/,
        ].some(regex => regex.test(error?.message))
      ) {
        const name = NETWORKS_INFO[desiredChainId].name
        message = t`Your wallet not support chain ${name}`
      } else {
        message = error?.message || message
        const e = new Error(`[Activate chain] ${connector?.id} ${message}`)
        e.name = 'Activate chain error'
        captureException(e, {
          level: 'warning',
          extra: { error, wallet: connector?.id, chainId, desiredChainId, message },
        })
      }
      notify({
        title,
        type: NotificationType.ERROR,
        summary: friendlyError(message),
      })
      customFailureCallback?.(error)
    },
    [chainId, connector, notify],
  )

  const addNewNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      customRpc: string,
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
      if (!library?.provider?.request) return
      const wrappedSuccessCallback = () => {
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)
      }

      const addChainParameter = {
        chainId: '0x' + desiredChainId.toString(16),
        rpcUrls: [customRpc],
        chainName: customTexts?.name || NETWORKS_INFO[desiredChainId].name,
        nativeCurrency: {
          name: NETWORKS_INFO[desiredChainId].nativeToken.name,
          symbol: NETWORKS_INFO[desiredChainId].nativeToken.symbol,
          decimals: 18 as const,
        },
        blockExplorerUrls: [NETWORKS_INFO[desiredChainId].etherscanUrl],
      }

      const errors: Error[] = []
      try {
        await library?.provider?.request({
          method: 'wallet_addEthereumChain',
          params: [addChainParameter],
        })
        wrappedSuccessCallback()
        return
      } catch (error) {
        if (didUserReject(error)) {
          failureCallback(desiredChainId, error, customFailureCallback, customTexts)
          return
        }
        errors.push(error)
      }

      failureCallback(desiredChainId, errors.at(-1), customFailureCallback, customTexts)
    },
    [failureCallback, library?.provider, successCallback],
  )

  const changeNetwork = useCallback(
    async (
      desiredChainId: ChainId,
      customSuccessCallback?: () => void,
      customFailureCallback?: (error: Error) => void,
      waitUtilUpdatedChainId = false, //todo: force all to true
      //isAddNetworkIfPossible = true,
    ) => {
      const wrappedSuccessCallback = () =>
        successCallback(desiredChainId, waitUtilUpdatedChainId, customSuccessCallback)
      // if connected, nothing todo, success return
      if (desiredChainId === chainId && kyberChainId === chainId && !isWrongNetwork) {
        customSuccessCallback?.()
        return
      }

      // if changing to network not connected wallet, update redux and success return
      if (!active) {
        changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
        return
      }

      console.info('[Switch network] start:', { desiredChainId })
      switchChain(
        { chainId: desiredChainId as any },
        {
          onSuccess: () => {
            console.info('[Switch network] success:', { desiredChainId })
            changeNetworkHandler(desiredChainId, wrappedSuccessCallback)
          },
          onError: error => {
            if (kyberChainId !== chainId && chainId) dispatch(updateChainId(chainId))
            console.error(
              '[Switch network] error:',
              JSON.stringify({ desiredChainId, error, didUserReject: didUserReject(error) }, null, 2),
            )
            if (
              didUserReject(error)
              //|| connector === walletConnectV2 || connector === krystalWalletConnectV2
            ) {
              failureCallback(desiredChainId, error, customFailureCallback)
              return
            }
          },
        },
      )
    },
    [
      chainId,
      kyberChainId,
      active,
      dispatch,
      changeNetworkHandler,
      successCallback,
      failureCallback,
      isWrongNetwork,
      switchChain,
    ],
  )

  return { changeNetwork, addNewNetwork }
}
