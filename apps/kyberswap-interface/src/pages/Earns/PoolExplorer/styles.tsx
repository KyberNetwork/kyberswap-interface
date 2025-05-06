import { rgba } from 'polished'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
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

export const Tag = styled.div<{ active: boolean }>`
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
  height: 42px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 38px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
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
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 0 -16px;
    border-radius: 0;
  `}
`

export const ContentWrapper = styled.div``

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr 0.5fr 0.8fr 1fr 1fr 80px;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px solid ${({ theme }) => theme.tableHeader};
  padding-bottom: 24px;
  margin: 24px;
  margin-bottom: 0;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1.2fr 0.5fr 0.8fr 1fr 1fr 80px;
  `}
`

export const TableBody = styled.div`
  max-height: 740px;
  overflow-y: auto;
`

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr 0.5fr 0.8fr 1fr 1fr 80px;
  padding: 24px;
  cursor: pointer;

  :hover {
    background: #31cb9e1a;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1.2fr 0.5fr 0.8fr 1fr 1fr 80px;
  `}
`

export const FeeTier = styled.div`
  border-radius: 30px;
  padding: 4px 8px;
  font-size: 12px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  color: ${({ theme }) => theme.subText};
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
  `}
`

export const SymbolText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Apr = styled.div<{ positive: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: ${({ positive, theme }) => (positive ? theme.primary : theme.red)};
`

export const MobileTableRow = styled.div`
  padding: 28px 24px 0;
  cursor: pointer;
`
export const MobileTableBottomRow = styled.div<{ withoutBorder: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  gap: 12px;
  border-bottom: ${({ withoutBorder, theme }) => (withoutBorder ? 'none' : `1px solid ${theme.tableHeader}`)};
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
