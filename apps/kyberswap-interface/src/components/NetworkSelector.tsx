import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { type Chain, isNonEvmChain } from 'pages/CrossChainSwap/adapters/types'

type NetworkSelectorProps = {
  chainId: ChainId
  customOnSelectNetwork?: (chain: Chain) => void
}

export const NetworkSelector = ({ chainId, customOnSelectNetwork }: NetworkSelectorProps) => {
  const [isOpenNetworkModal, setIsOpenNetworkModal] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const selectedNetwork = NETWORKS_INFO[chainId]

  return (
    <>
      <NetworkModal
        selectedId={chainId}
        customOnSelectNetwork={
          customOnSelectNetwork ||
          (chain => {
            if (isNonEvmChain(chain)) return
            setSearchParams(prev => {
              const nextSearchParams = new URLSearchParams(prev)
              nextSearchParams.set('chainId', chain.toString())
              nextSearchParams.set('inputCurrency', NativeCurrencies[chain].symbol || 'eth')
              nextSearchParams.set('outputCurrency', DEFAULT_OUTPUT_TOKENS[chain]?.address || '')
              return nextSearchParams
            })
          })
        }
        isOpen={isOpenNetworkModal}
        customToggleModal={() => setIsOpenNetworkModal(prev => !prev)}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-subText">
          <Trans>Choose a chain</Trans>
        </span>

        <button
          type="button"
          onClick={() => setIsOpenNetworkModal(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full border-none bg-buttonBlack px-3 py-1.5 text-sm font-medium text-subText outline-none hover:text-text focus-visible:text-text"
        >
          <img src={selectedNetwork.icon} alt="Network" className="size-5" />
          <span>{selectedNetwork.name}</span>
          <DropdownSVG className="text-inherit" />
        </button>
      </div>
    </>
  )
}
