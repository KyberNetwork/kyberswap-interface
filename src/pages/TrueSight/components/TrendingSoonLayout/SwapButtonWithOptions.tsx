import useTheme from 'hooks/useTheme'
import React, { CSSProperties, useRef, useState } from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ButtonPrimary } from 'components/Button'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import { ETHER } from '@dynamic-amm/sdk'
import styled from 'styled-components'

const SwapButtonWithOptions = ({ style }: { style?: CSSProperties }) => {
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowNetworks(false))

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
          <Flex alignItems="center">
            <CurrencyLogo currency={ETHER} size="16px" />
            <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
              <Trans>Swap on Ethereum</Trans>
            </Text>
          </Flex>
          <Flex alignItems="center">
            <CurrencyLogo currency={ETHER} size="16px" />
            <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
              <Trans>Swap on Avalanche</Trans>
            </Text>
          </Flex>
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

  & > * {
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }
`
