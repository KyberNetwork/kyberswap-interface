import { rgba } from 'polished'
import { Box, Flex } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { TableHeader, TableWrapper } from 'pages/Earns/PoolExplorer/styles'

export const FilterRow = styled(Flex)`
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
`

export const TagList = styled(Flex)`
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 100%;
  `}
`

export const MarketTableWrapper = styled(TableWrapper)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 0 -16px;
    border-radius: 0;
  `}
`

export const ContentWrapper = styled.div``

export const MarketTableHeader = styled(TableHeader)`
  grid-template-columns: 1fr 1fr 0.7fr 0.7fr 0.6fr 0.6fr 100px;
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

export const SortableHeader = styled(Flex)`
  align-items: center;
  gap: 4px;
  width: fit-content;
  cursor: pointer;

  &:hover svg path {
    stroke: ${({ theme }) => theme.text};
  }
`

export const TableRow = styled(MarketTableHeader)`
  border-bottom: none;

  &:hover {
    cursor: pointer;
    background: #31cb9e1a;
  }
`

export const MobileTableRow = styled.div`
  padding: 20px 24px 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.tableHeader};
`

export const MobileTableBottomRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 12px;
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
      animation: ${up ? pulse : pulseRed} 0.6s;
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
