import React, { ReactNode, useRef, useState } from 'react'
import CurrencyLogo from 'components/CurrencyLogo'
import { ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import AddTokenToMetaMask from 'components/AddToMetamask'
import styled from 'styled-components'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Box, Flex } from 'rebass'

function AddressButtonItself({
  isInOptionContainer = false,
  optionRender,
  toggleShowOptions
}: {
  isInOptionContainer?: boolean
  optionRender?: ReactNode
  toggleShowOptions?: () => void
}) {
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied('123')
  }

  return (
    <StyledAddressButton isInOptionContainer={isInOptionContainer}>
      <CurrencyLogo currency={ETHER} size="16px" />
      <AddressCopyContainer onClick={onCopy}>
        <div>0x394...5e3</div>
        {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
      </AddressCopyContainer>
      <AddTokenToMetaMask token={WETH[ChainId.MAINNET]} chainId={ChainId.MAINNET} />
      <ChevronDownWrapper
        style={{ visibility: isInOptionContainer ? 'hidden' : 'visible' }}
        onClick={toggleShowOptions}
      >
        <ChevronDown size="16px" cursor="pointer" />
      </ChevronDownWrapper>
      {optionRender}
    </StyledAddressButton>
  )
}

export default function AddressButton() {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleShowOptions = () => setIsShowOptions(prev => !prev)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  const optionRender = isShowOptions ? (
    <OptionsContainer>
      <AddressButtonItself isInOptionContainer />
      <AddressButtonItself isInOptionContainer />
      <AddressButtonItself isInOptionContainer />
    </OptionsContainer>
  ) : null

  return (
    <Box ref={containerRef}>
      <AddressButtonItself optionRender={optionRender} toggleShowOptions={toggleShowOptions} />
    </Box>
  )
}

const AddressCopyContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

const ChevronDownWrapper = styled.div`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

export const StyledAddressButton = styled(Flex)<{ isInOptionContainer?: boolean }>`
  align-items: center;
  padding: 7px 12px;
  gap: 4px;
  width: fit-content;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme, isInOptionContainer }) => (isInOptionContainer ? 'transparent' : theme.buttonBlack)};
  border-radius: ${({ isInOptionContainer }) => (isInOptionContainer ? '0' : '4px')};
  cursor: pointer;
  position: relative;
`
