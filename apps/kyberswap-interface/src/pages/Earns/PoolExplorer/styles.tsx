import { rgba } from 'polished'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

export const PoolPageWrapper = styled.div`
  padding: 32px 24px 68px;
  width: 100%;
  max-width: 1500px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const LiquidityWidgetWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

export const HeadSection = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`

export const TagContainer = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 0.75rem;
  `}
`

export const Tag = styled.div<{ active: boolean; height?: number }>`
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : theme.background)};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border-radius: 12px;
  padding: 4px 16px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-weight: ${({ active }) => (active ? '500' : '400')};
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  line-height: 28px;
  height: ${({ height }) => (height ? `${height}px` : '42px')};
  transition: background-color 200ms ease, border-color 200ms ease;

  &[role='button']:hover {
    background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.3) : rgba(theme.primary, 0.1))};
    border-color: ${({ theme, active }) => (active ? theme.primary : rgba(theme.primary, 0.5))};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 38px;
  `}
`

export const StyledNavigateButton = styled.div<{ mobileFullWidth?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  padding: 8px 16px;
  width: max-content;
  font-size: 14px;
  cursor: pointer;

  :hover {
    filter: brightness(1.1);
  }

  ${({ theme, mobileFullWidth }) => theme.mediaWidth.upToSmall`
    ${mobileFullWidth && 'width: 100%;'}
  `}
`

interface NavigateButtonProps {
  icon: React.ReactNode
  text: string
  to: string
  mobileFullWidth?: boolean
}

export const NavigateButton: React.FC<NavigateButtonProps> = ({ icon, text, to, mobileFullWidth }) => {
  const navigate = useNavigate()

  return (
    <StyledNavigateButton mobileFullWidth={mobileFullWidth} onClick={() => navigate({ pathname: to })}>
      {icon}
      <Text width={'max-content'}>{text}</Text>
    </StyledNavigateButton>
  )
}

export const TableWrapper = styled.div`
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 16px;
  position: relative;
  overflow: hidden;
`

export const PoolTableWrapper = styled(TableWrapper)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 0 -16px;
    border-radius: 0;
  `}
`

export const MigrateTableWrapper = styled(TableWrapper)`
  width: 100%;
  margin: 0 !important;
`

export const ContentWrapper = styled.div``

export const TableHeader = styled.div<{ expandColumn?: boolean }>`
  display: grid;
  grid-template-columns: ${({ expandColumn }) =>
    expandColumn ? '2fr 0.6fr 0.9fr 0.9fr 0.9fr 0.9fr 80px' : '2fr 0.6fr 0.9fr 1fr 1fr 80px'};
  align-items: center;
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px solid ${({ theme }) => theme.tableHeader};
  padding: 24px;
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

export const MigrateTableHeader = styled(TableHeader)`
  grid-template-columns: 2.5fr 0.8fr 1fr 1fr 1fr !important;
`

export const MigrateTableBody = styled.div`
  max-height: 432px;
  overflow-y: auto;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-height: 495px;
  `}
`

export const TableRow = styled(TableHeader)`
  border-bottom: none;

  :hover {
    cursor: pointer;
    background: #31cb9e1a;
  }
`

export const MigrateTableRow = styled(MigrateTableHeader)`
  border-bottom: none;

  :hover {
    cursor: pointer;
    background: #31cb9e1a;
  }
`

export const RowItem = styled(Flex)<{ justifyContent?: string; alignItems?: string }>`
  height: 100%;
  flex-direction: column;
  justify-content: ${({ justifyContent }) => justifyContent || 'flex-start'};
  align-items: ${({ alignItems }) => alignItems || 'flex-start'};
  gap: 8px;
`

export const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 30px;
  padding: 4px 6px 4px 4px;
  font-size: 12px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  color: ${({ theme }) => theme.subText};
  width: fit-content;
`

export const FeeTier = styled(Badge)`
  padding: 4px 8px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
  `}
`

export const SymbolText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
`

export const Apr = styled.div<{ value: number }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: ${({ value, theme }) => (value > 0 ? theme.primary : value < 0 ? theme.red : theme.text)};
`

export const MobileTableRow = styled.div`
  padding: 28px 24px 24px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.tableHeader};
`

export const MobileTableBottomRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 12px;
`

export const Disclaimer = styled.div`
  font-size: 14px;
  font-style: italic;
  color: #737373;
  text-align: center;
  width: 100%;
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    bottom: 20px;
  `}
`

export const ProgressBarWrapper = styled.div`
  position: absolute;
  width: 100%;
`
