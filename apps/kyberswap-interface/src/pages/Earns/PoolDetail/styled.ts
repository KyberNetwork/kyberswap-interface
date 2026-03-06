import { rgba } from 'polished'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { PoolPageWrapper } from 'pages/Earns/PoolExplorer/styles'

export const PoolDetailWrapper = styled(PoolPageWrapper)`
  padding: 32px 24px 68px;
  margin: 0 auto;
  width: 100%;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const PoolHeaderContainer = styled(HStack)`
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  padding: 8px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.tabActive};
`

export const PoolHeaderTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 22px;
  `}
`

export const PoolHeaderMeta = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
`

export const AddLiquidityContent = styled(HStack)`
  width: 100%;
  align-items: flex-start;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

export const AddLiquidityFormColumn = styled(Stack)`
  flex: 2 1 0;
  min-width: 0;
  gap: 16px;
`

export const AddLiquidityRouteColumn = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 16px;
`

export const SectionCard = styled(Stack)`
  min-height: 180px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  padding: 16px;
  background: ${({ theme }) => rgba(theme.background, 0.98)};
  color: ${({ theme }) => theme.text};
`

export const SectionTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  font-weight: 600;
`

export const AddLiquiditySlot = styled(Stack)`
  gap: 16px;
`

export const PoolInfoContent = styled(Stack)`
  width: 100%;
  gap: 16px;
`

export const PoolInfoContentCard = styled(Stack)`
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  padding: 16px;
  background: ${({ theme }) => rgba(theme.background, 0.98)};
  gap: 12px;
  color: ${({ theme }) => theme.text};
`

export const PoolInfoHeader = styled(HStack)`
  width: 100%;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`

export const PoolTabsBar = styled(HStack)`
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

export const PoolInfoTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: 600;
`

type PoolInfoTabProps = {
  $active?: boolean
}

export const PoolInfoTab = styled.div<PoolInfoTabProps>`
  border: 1px solid ${({ $active, theme }) => ($active ? theme.primary : theme.tabActive)};
  color: ${({ $active, theme }) => ($active ? theme.primary : theme.subText)};
  background: ${({ $active, theme }) => ($active ? rgba(theme.primary, 0.2) : rgba(theme.white, 0.04))};
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
`

export const PoolInfoPlaceholder = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 1.5;
`

export const PoolInfoActivePlaceholder = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: 600;
  min-width: 100px;
`
