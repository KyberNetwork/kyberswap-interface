import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { isNonEvmChain } from 'utils'

export const NetworkSelector = ({
  chainId,
  customOnSelectNetwork,
}: {
  chainId: ChainId
  customOnSelectNetwork?: (chain: ChainId) => void
}) => {
  const [isOpenNetworkModal, setIsOpenNetworkModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <>
      <NetworkModal
        selectedId={chainId}
        customOnSelectNetwork={
          // TODO: resolve type here
          (customOnSelectNetwork as any) ||
          (chain => {
            if (isNonEvmChain(chain)) return
            searchParams.set('chainId', chain.toString())
            searchParams.set('inputCurrency', NativeCurrencies[chain as ChainId].symbol || 'eth')
            searchParams.set('outputCurrency', DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chain as ChainId]?.address || '')
            setSearchParams(searchParams)
          })
        }
        isOpen={isOpenNetworkModal}
        customToggleModal={() => setIsOpenNetworkModal(prev => !prev)}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-subText">
          <Trans>Choose a chain</Trans>
        </span>

        <div
          role="button"
          onClick={() => setIsOpenNetworkModal(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-buttonBlack px-3 py-1.5 text-sm font-medium text-subText"
        >
          <img src={NETWORKS_INFO[chainId].icon} alt="Network" className="size-5" />
          <span>{NETWORKS_INFO[chainId].name}</span>
          <DropdownSVG />
        </div>
      </div>
    </>
  )
}
