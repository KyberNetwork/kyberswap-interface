import { motion } from 'framer-motion'
import { Flex } from 'rebass'
import styled, { DefaultTheme, css, keyframes } from 'styled-components'

import { ButtonPrimary } from 'components/Button'

export const PoolsPageWrapper = styled.div`
  padding: 32px 24px 50px;
  width: 100%;
  max-width: 1500px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}

  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const SelectGroup = styled(Flex)`
  width: 100%;
  padding: 8px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  align-self: stretch;
  border-radius: 24px;
  background: ${({ theme }) => theme['greyscale-600']};
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
`

export const OptionsGroup = motion(styled(Flex)`
  width: 100%;
  padding: 20px;
  flex-direction: column;
  border-radius: 0 0 20px 20px;
  border-radius: 20px;
  gap: 20px;
  background: ${({ theme }) => theme['greyscale-600']};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`)

export const Tab = styled.div<{ active?: boolean; color?: string; padding?: string; disabled?: boolean }>`
  padding: ${({ padding }) => padding || '6px 12px'};
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  border-radius: 999px;
  cursor: pointer;
  color: ${({ active, theme, color }) => color || (active ? theme.text : theme.subText)};
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  ${({ disabled, theme }) =>
    disabled &&
    css`
      user-select: none;
      color: ${theme.subText}55;
      cursor: not-allowed;
    `}
`

const highlight = (theme: DefaultTheme) => keyframes`
  0%{
    box-shadow: 0 0 0px 0px ${theme.primary};
  }
  100%{
    box-shadow: 0 0 8px 4px ${theme.primary};
  }
`

export const ButtonPrimaryWithHighlight = styled(ButtonPrimary)`
  padding: 10px 12px;
  float: right;
  border-radius: 40px;
  font-size: 14px;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 0.8s 8 alternate ease-in-out;
  }
`

export const Tag = styled(Flex)<{ color: string; backgroundColor: string }>`
  min-width: max-content;
  width: max-content;
  border-radius: 999px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ color }) => color};
  font-size: 10px;
  font-weight: 500;
  line-height: 14px;
  padding: 1px 4px;
  align-items: center;
  height: 16px;
`

export const TableHeader = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  padding: 16px 24px 16px 0;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  min-width: 1250px;

  & > * {
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.background};
  }
  background: ${({ theme }) => theme.background};
  & > th:nth-child(1) {
    padding-left: 24px;
    position: sticky;
    left: 0;
  }
  position: sticky;
  top: 0px;
`

export const TableRow = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  padding: 24px 24px 24px 0;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  min-width: 1250px;

  & > * {
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme['greyscale-900']};
  }
  background-color: ${({ theme }) => theme['greyscale-900']};

  & > td:nth-child(1) {
    padding-left: 24px;
    position: sticky;
    left: 0;
  }
`
