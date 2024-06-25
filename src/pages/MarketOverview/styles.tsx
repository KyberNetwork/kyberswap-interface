import { rgba } from 'polished'
import { Box, Flex } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

export const TableWrapper = styled.div`
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 16px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 0 -16px;
  `}
`

export const ContentWrapper = styled.div`
  padding: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

export const Tag = styled.div<{ active: boolean }>`
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : theme.tableHeader)};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-weight: ${({ active }) => (active ? '500' : '400')};
`

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1.2fr 100px;
  align-items: center;
`

export const TableRow = styled(TableHeader)`
  grid-template-columns: 1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr 100px;
  border-bottom: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.buttonBlack};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr 1fr;
  `}
`

export const SubHeaderRow = styled(TableRow)`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  &:hover {
    background: none;
  }
`

export const InnerGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`

export const Tabs = styled.div`
  padding: 1rem 0 1rem;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.subText};
`

export const Tab = styled.div<{ active: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;
`

const pulse = keyframes`
  0% {
    color: #31CB9E;
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    color: #ffffff;
    opacity: 1;
  }
`

const pulseRed = keyframes`
  0% {
    color: #FF6871;
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    color: #ffffff;
    opacity: 1;
  }
`

export const ContentChangable = styled.div<{ animate: boolean; up: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  ${({ animate, up }) =>
    animate &&
    css`
      animation: ${up ? pulse : pulseRed} 1.2s;
    `}
`

export const PriceSelectionField = styled.div<{ active: boolean }>`
  padding: 6px 12px;
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : undefined)};
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  text-align: center;
`

export const TabItem = styled(Flex)<{ active?: boolean }>`
  padding: 4px 8px;
  align-items: center;
  border-radius: 999px;
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
`
