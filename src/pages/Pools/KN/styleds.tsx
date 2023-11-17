import { lighten, rgba } from 'polished'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'

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

export const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const SelectPairInstructionWrapper = styled.div`
  text-align: center;
  height: 100%;
  padding: 24px;
`

export const IconWrapper = styled.div`
  border-radius: 50%;
  background: ${({ theme }) => theme.apr};
  width: 18px;
  height: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const ButtonIcon = styled(ButtonEmpty)<{ color?: string }>`
  background: ${({ theme, color }) => rgba(color || theme.subText, 0.2)};
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  border-radius: 50%;
  padding: 0;
  color: ${({ theme, color }) => color || theme.subText} !important;

  :hover {
    background: ${({ theme, color }) => lighten(0.4, rgba(color || theme.subText, 0.2))};
  }
`

export const Tab = styled.div<{ active?: boolean; color?: string }>`
  padding: 6px 12px;
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  border-radius: 999px;
  cursor: pointer;
  color: ${({ active, theme, color }) => color || (active ? theme.text : theme.subText)};
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
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
