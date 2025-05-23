import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'

import NetworkModal from './Header/web3/NetworkModal'
import { isNonEvmChain } from 'utils'

const SelectNetwork = styled.div`
  border: 999px;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  cursor: pointer;
`

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

        <SelectNetwork role="button" onClick={() => setIsOpenNetworkModal(true)}>
          <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ height: '20px', width: '20px' }} />
          <Text>{NETWORKS_INFO[chainId].name}</Text>
          <DropdownSVG />
        </SelectNetwork>
      </Flex>
    </>
  )
}
