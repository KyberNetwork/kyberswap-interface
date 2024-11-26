import { rgba } from 'polished'
import styled from 'styled-components'

import { Image } from 'components/Image'

export const PoolsExplorerWrapper = styled.div`
  padding: 32px 24px 50px;
  width: 100%;
  max-width: 1500px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}

  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const LiquidityWidgetWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

export const TagContainer = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  overflow-x: auto;

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
`

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
  grid-template-columns: 1fr 1fr 0.5fr 1fr 1fr 1fr 80px;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px solid ${({ theme }) => theme.tableHeader};
  padding-bottom: 24px;
  margin: 24px;
  margin-bottom: 0;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1.2fr 0.5fr 1fr 1fr 1fr 80px;
  `}
`

export const TableBody = styled.div`
  max-height: 720px;
  overflow-y: auto;
`

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 1fr 1fr 1fr 80px;
  padding: 24px;
  cursor: pointer;

  :hover {
    background: #31cb9e1a;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1.2fr 0.5fr 1fr 1fr 1fr 80px;
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

export const CurrencyRoundedImage = styled(Image)`
  border-radius: 50%;
`

export const CurrencySecondImage = styled(CurrencyRoundedImage)`
  position: relative;
  left: -6px;
`

export const SymbolText = styled.div`
  max-width: 115px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Apr = styled.div<{ positive: boolean }>`
  display: flex;
  justify-content: flex-end;
  color: ${({ positive, theme }) => (positive ? theme.primary : theme.red)};
`

export const MobileTableRow = styled.div`
  padding: 28px 24px 0;
  cursor: pointer;

  :hover {
    background: ${({ theme }) => rgba(theme.primary, 0.2)};
  }
`
export const MobileTableBottomRow = styled.div<{ withoutBorder: boolean }>`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  padding: 16px 0;
  border-bottom: ${({ withoutBorder, theme }) => (withoutBorder ? 'none' : `1px solid ${theme.tableHeader}`)};
`
