import { t } from '@lingui/macro'
import { ChainId } from '@namgold/ks-sdk-core'
import { UnsupportedChainIdError } from '@web3-react/core'
import { stringify } from 'qs'
import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'

import { EVM_NETWORK, NETWORKS_INFO, SUPPORTED_NETWORKS, isEVM } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'

import useParsedQueryString from './useParsedQueryString'

const getEVMAddNetworkParams = (chainId: EVM_NETWORK) => ({
  chainId: '0x' + chainId.toString(16),
  chainName: NETWORKS_INFO[chainId].name,
  nativeCurrency: {
    name: NETWORKS_INFO[chainId].nativeToken.name,
    symbol: NETWORKS_INFO[chainId].nativeToken.symbol,
    decimals: NETWORKS_INFO[chainId].nativeToken.decimal,
  },
  rpcUrls: [NETWORKS_INFO[chainId].rpcUrl],
  blockExplorerUrls: [NETWORKS_INFO[chainId].etherscanUrl],
})

/**
 * Given a network string (e.g. from user agent), return the best match for corresponding SupportedNetwork
 * @param maybeSupportedNetwork the fuzzy network identifier, can be networkId (1, 137, ...) or networkName (ethereum, polygon, ...)
 */
function parseNetworkId(maybeSupportedNetwork: string): ChainId | undefined {
  return SUPPORTED_NETWORKS.find(chainId => {
    return chainId.toString() === maybeSupportedNetwork || NETWORKS_INFO[chainId].route === maybeSupportedNetwork
  })
}

export function useChangeNetwork() {
  const { chainId } = useActiveWeb3React()
  const { library, error } = useWeb3React()

  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString<{ networkId: string }>()
  const dispatch = useAppDispatch()
  const notify = useNotify()

  const locationWithoutNetworkId = useMemo(() => {
    // Delete networkId from qs object
    const { networkId, ...qsWithoutNetworkId } = qs
    return { ...location, search: stringify({ ...qsWithoutNetworkId }) }
  }, [location, qs])

  const changeNetwork = useCallback(
    async (desiredChainId: ChainId, successCallback?: () => void, failureCallback?: () => void) => {
      if (isEVM(desiredChainId)) {
        const switchNetworkParams = {
          chainId: '0x' + Number(desiredChainId).toString(16),
        }
        const isNotConnected = !(library && library.provider)
        const isWrongNetwork = error instanceof UnsupportedChainIdError
        // if (isNotConnected && !isWrongNetwork && chainIdEVM !== desiredChainId) {
        if (isNotConnected && !isWrongNetwork) {
          dispatch(updateChainId(desiredChainId))
          successCallback?.()
          return
        }

        history.push(locationWithoutNetworkId)
        const activeProvider = library?.provider ?? window.ethereum
        if (activeProvider && activeProvider.request) {
          try {
            await activeProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [switchNetworkParams],
            })
            dispatch(updateChainId(desiredChainId))
            successCallback?.()
          } catch (switchError) {
            // This is a workaround solution for Coin98
            const isSwitchError =
              typeof switchError === 'object' && switchError && Object.keys(switchError)?.length === 0
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError?.code === 4902 || switchError?.code === -32603 || isSwitchError) {
              try {
                const addNetworkParams = getEVMAddNetworkParams(desiredChainId)
                await activeProvider.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
                if (chainId !== desiredChainId) {
                  notify({
                    title: t`Failed to switch network`,
                    type: NotificationType.ERROR,
                    summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
                  })
                }
                dispatch(updateChainId(desiredChainId))
                successCallback?.()
              } catch (addError) {
                console.error(addError)
                failureCallback?.()
              }
            } else {
              // handle other "switch" errors
              console.error(switchError)
              failureCallback?.()
              notify({
                title: t`Failed to switch network`,
                type: NotificationType.ERROR,
                summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
              })
            }
          }
        }
      } else {
        dispatch(updateChainId(desiredChainId))
        successCallback?.()
      }
    },
    [dispatch, history, library, locationWithoutNetworkId, error, notify, chainId],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return changeNetwork
}
