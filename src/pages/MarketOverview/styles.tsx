import { rgba } from 'polished'
import { Box } from 'rebass'
import styled from 'styled-components'

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
  grid-template-columns: 1fr 2fr 1.2fr 160px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
`

export const TableRow = styled(TableHeader)`
  grid-template-columns: 1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr 160px;
  border-bottom: none;

  &:hover {
    background: ${({ theme }) => theme.buttonBlack};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr 1fr;
  `}
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
