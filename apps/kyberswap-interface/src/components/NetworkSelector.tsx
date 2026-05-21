import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { isNonEvmChain } from 'utils'

import NetworkModal from './Header/web3/NetworkModal'

export const NetworkSelector = ({
  chainId,
  customOnSelectNetwork,
}: {
  chainId: ChainId
  customOnSelectNetwork?: (chain: ChainId) => void
}) => {
  const theme = useTheme()
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
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize={12} fontWeight="500" color={theme.subText}>
          <Trans>Choose a chain</Trans>
        </Text>

        <div
          role="button"
          onClick={() => setIsOpenNetworkModal(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-buttonBlack px-3 py-1.5 text-sm font-medium text-subText"
        >
          <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ height: '20px', width: '20px' }} />
          <Text>{NETWORKS_INFO[chainId].name}</Text>
          <DropdownSVG />
        </div>
      </Flex>
    </>
  )
}
