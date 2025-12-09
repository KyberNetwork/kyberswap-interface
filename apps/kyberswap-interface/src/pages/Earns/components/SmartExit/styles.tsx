import { rgba } from 'polished'
import { Box } from 'rebass'
import styled from 'styled-components'

import Input from 'components/Input'
import Select from 'components/Select'

export const ContentWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

export const CustomBox = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.tableHeader};
  padding: 12px;
  flex-direction: column;
  gap: 0.75rem;
  display: flex;
`

export const CustomInput = styled(Input)`
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => rgba(theme.text, 0.04)};
  flex: 1;
`

export const CustomSelect = styled(Select)`
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => rgba(theme.text, 0.04)};
  flex: 1;
`

export const Divider = styled(Box)`
  height: 1px;
  background-color: ${({ theme }) => theme.tableHeader};
`

export const CustomOption = styled(Box)<{ isSelected?: boolean }>`
  border-radius: 24px;
  border: 1px solid ${({ theme, isSelected }) => (isSelected ? rgba(theme.primary, 0.2) : rgba(theme.text, 0.08))};
  background-color: ${({ theme, isSelected }) => (isSelected ? rgba(theme.primary, 0.2) : 'transparent')};
  padding: 4px 12px;
  color: ${({ theme, isSelected }) => (isSelected ? theme.white2 : '#737373')};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.1)};
  }
`

export const PriceInputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px;
  gap: 10px;
  border-radius: 12px;
  background-color: ${({ theme }) => rgba(theme.text, 0.04)};
  cursor: pointer;
  user-select: none;
`

export const PriceInputIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${({ theme }) => rgba(theme.text, 0.08)};
  user-select: none;
`

export const CustomPriceInput = styled(Input)`
  border: none;
  padding: 0;
  border-radius: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  background-color: transparent;
  flex: 1;
  text-align: center;
`

export const SettingContainer = styled.div`
  position: relative;
`

export const SettingMenu = styled.div`
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  position: absolute;
  top: 44px;
  right: 0;
  z-index: 5;
  min-width: 350px;
`

export const SettingButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => rgba(theme.text, 0.04)};
  background-color: ${({ theme }) => rgba(theme.text, 0.08)};
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(270deg);
  cursor: pointer;
  color: ${({ theme }) => rgba(theme.text, 0.6)};
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.text, 0.12)};
  }
`
