import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled from 'styled-components'

import ScrollableWithSignal from 'components/ScrollableWithSignal'

export const ChainRewardItem = styled.div<{ isSelected: boolean }>`
  position: relative;
  padding: 0 16px;
  transition: all 0.2s ease-in-out;
  border-radius: 12px;
  overflow: hidden;
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

export const ChainRewardTokens = styled(ScrollableWithSignal)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 32px;
  max-height: 0;
  overflow: hidden;
  border-top: 1px solid transparent;
  transition: all 0.2s ease-in-out;

  &[data-open='true'] {
    padding-block: 12px;
    max-height: 170px;
    overflow: auto;
    border-top-color: rgba(49, 203, 158, 0.2);
  }
`

export const FilteredChainWrapper = styled(Flex)`
  position: relative;
  flex-direction: column;
  overflow: hidden;
`

export const FilteredChainTitle = styled(Flex)`
  flex-wrap: wrap;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  gap: 4px;
  color: ${({ theme }) => theme.subText};
`

export const FilteredChainTokens = styled(ScrollableWithSignal)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.2s ease-in-out;

  &[data-open='true'] {
    margin-top: 12px;
    max-height: 136px;
    overflow: auto;
  }
`
