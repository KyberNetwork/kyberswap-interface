import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Input from 'components/NumericalInput'
import { HideMedium } from 'theme'

export const PageWrapper = styled.div`
  margin: 1rem 36px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 24px 12px;
  `};
`
export const Container = styled.div`
  width: 100%;
  border-radius: 20px;

  background: ${({ theme }) => theme.background};

  padding: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 24px;
  `};
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.buttonBlack};
  text-align: left;
  font-size: 24px;
  width: 100%;
`

export const RightContainer = styled(AutoColumn)`
  height: fit-content;
  min-width: 600px;
  width: 100%;
  padding-left: 24px;
  gap: 0;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-width: 450px;
  `};
`

export const ChartContainer = styled.div<{ hasTab: boolean }>`
  border-radius: ${({ hasTab }) => (hasTab ? '0 0 ' : '')} 20px 20px;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 16px;
`

export const FlexLeft = styled(Flex)`
  flex-shrink: 0;
  flex-direction: column;
  gap: 24px;

  width: 425px;
  padding-right: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    padding-right: 0px;
  `};
`

export const StackedContainer = styled.div`
  display: grid;
`

export const StackedItem = styled.div<{ zIndex?: number }>`
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`

export const BorderedHideMedium = styled(HideMedium)`
  border-left: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-left: none;
`};
`

export const RangeBtn = styled(ButtonOutlined)<{ isSelected: boolean }>`
  width: 100%;
  padding-top: 8px;
  padding-bottom: 8px;
  ${({ isSelected, theme }) =>
    isSelected
      ? css`
          border-color: ${theme.primary};
          color: ${theme.primary};
          pointer-events: none;
          cursor: not-allowed;
          box-shadow: none;
          &:focus {
            box-shadow: none;
          }
          &:hover {
            box-shadow: none;
          }
          &:active {
            box-shadow: none;
          }
        `
      : ''}
`
