import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled from 'styled-components'

export const ChainRewardItem = styled.div<{ isSelected: boolean }>`
  padding: 0 16px;
  transition: all 0.2s ease-in-out;
  border-radius: 12px;
  background-color: ${({ theme, isSelected }) => (isSelected ? rgba(49, 203, 158, 0.1) : rgba(theme.white, 0.04))};
  border: 1px solid ${({ theme, isSelected }) => (isSelected ? '#047855' : rgba(theme.white, 0.04))};
  :hover {
    background-color: ${({ theme, isSelected }) => (isSelected ? rgba(49, 203, 158, 0.15) : rgba(theme.white, 0.08))};
  }
`

export const CustomRadio = styled.input<{ isSelected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #bdbdbd;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s;
  top: -1px;

  &::before {
    content: '';
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ isSelected }) => (isSelected ? '#1ecb98' : 'transparent')};
    position: absolute;
    top: 2px;
    left: 2px;
    transition: background 0.2s;
  }
`

export const ChainRewardTitle = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding-block: 12px;
`

export const ChainRewardTokens = styled(Flex)<{ isOpen: boolean }>`
  flex-direction: column;
  gap: 12px;
  padding: ${({ isOpen }) => (isOpen ? '12px 0 12px 32px' : '0 0 0 32px')};
  overflow: ${({ isOpen }) => (isOpen ? 'auto' : 'hidden')};
  max-height: ${({ isOpen }) => (isOpen ? '168px' : '0')};
  border-top: 1px solid ${({ isOpen }) => (isOpen ? rgba(49, 203, 158, 0.2) : 'transparent')};
  transition: all 0.2s ease-in-out;
`

export const FilteredChainTitle = styled(Flex)`
  flex-wrap: wrap;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  gap: 4px;
  color: ${({ theme }) => theme.subText};
`

export const FilteredChainTokens = styled(Flex)<{ isOpen: boolean }>`
  flex-direction: column;
  gap: 8px;
  margin-top: ${({ isOpen }) => (isOpen ? '12px !important' : '0')};
  overflow: ${({ isOpen }) => (isOpen ? 'auto' : 'hidden')};
  max-height: ${({ isOpen }) => (isOpen ? '135px' : '0')};
  transition: all 0.2s ease-in-out;
`
