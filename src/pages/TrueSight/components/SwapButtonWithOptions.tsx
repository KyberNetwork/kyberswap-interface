import useTheme from 'hooks/useTheme'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ButtonPrimary } from 'components/Button'
import { t, Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { NETWORK_ICON, NETWORK_LABEL, TRUESIGHT_NETWORK_MAP } from 'constants/networks'
import { useHistory } from 'react-router'
import { getAddress } from '@ethersproject/address'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@dynamic-amm/sdk'

const SwapButtonWithOptions = ({ platforms, style }: { platforms: { [p: string]: string }; style?: CSSProperties }) => {
  const history = useHistory()
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowNetworks(false))

  const { changeNetwork } = useActiveNetwork()

  const [pushAddressWithChainId, setPushAddressWithChainId] = useState<
    { address: string; chainId: ChainId } | undefined
  >()
  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    if (pushAddressWithChainId) {
      if (chainId === pushAddressWithChainId.chainId) {
        history.push(`/swap?inputCurrency=ETH&outputCurrency=${pushAddressWithChainId.address}`)
      } else {
        alert(
          t`You need to convert the network to ${
            NETWORK_LABEL[pushAddressWithChainId.chainId]
          } before swapping with this token.`
        )
      }
    }
    setPushAddressWithChainId(undefined)
  }, [history, chainId, pushAddressWithChainId])

  return (
    <ButtonPrimary
      minWidth="160px"
      width="fit-content"
      height="36px"
      padding="0 36px"
      fontSize="14px"
      style={{ position: 'relative', zIndex: 2, ...style }}
      onClick={() => setIsShowNetworks(prev => !prev)}
      ref={containerRef}
    >
      <Trans>Swap</Trans>
      <ChevronDown
        size="16px"
        style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }}
      />
      {isShowNetworks && (
        <ChooseNetworkForSwapContainer>
          {Object.keys(platforms).map(platform => {
            const mappedChainId = platform ? TRUESIGHT_NETWORK_MAP[platform] : undefined
            if (mappedChainId)
              return (
                <Flex
                  key={platform}
                  alignItems="center"
                  onClick={async () => {
                    await changeNetwork(mappedChainId)
                    setPushAddressWithChainId({
                      address: getAddress(platforms[platform]),
                      chainId: mappedChainId
                    })
                  }}
                >
                  <img src={NETWORK_ICON[mappedChainId]} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
                  <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                    <Trans>Swap on {NETWORK_LABEL[mappedChainId]}</Trans>
                  </Text>
                </Flex>
              )

            return null
          })}
        </ChooseNetworkForSwapContainer>
      )}
    </ButtonPrimary>
  )
}

export default SwapButtonWithOptions

const ChooseNetworkForSwapContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  left: 0;
  flex-direction: column;
  z-index: 9999;
  width: 100%;
  transform: translateY(100%);
  border-radius: 4px;
  background: ${({ theme }) => theme.tableHeader};
  box-shadow: 0 0 0 1px ${({ theme }) => theme.bg4};

  & > * {
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }
`
