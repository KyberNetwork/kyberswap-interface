import { rgba } from 'polished'
import styled from 'styled-components'

export const ChainRewardItem = styled.div<{ isSelected: boolean }>`
  padding: 0 16px;
  transition: all 0.2s ease-in-out;
  border-radius: 12px;
  background-color: ${({ theme, isSelected }) => (isSelected ? rgba(49, 203, 158, 0.1) : rgba(theme.white, 0.04))};
  border: 1px solid ${({ theme, isSelected }) => (isSelected ? '#047855' : rgba(theme.white, 0.04))};
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

export const ChainDetailInfo = styled.div<{ isOpen: boolean }>`
  height: ${({ isOpen }) => (isOpen ? 'auto' : '0')};
  padding: ${({ isOpen }) => (isOpen ? '12px 0 12px 32px' : '0')};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid ${({ isOpen }) => (isOpen ? rgba(49, 203, 158, 0.2) : 'transparent')};
  transition: all 0.2s ease-in-out;
`
