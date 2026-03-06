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
  gap: 14px;
  flex-wrap: nowrap;
  min-width: 0;
  padding: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
  `}
`

export const PoolHeaderLead = styled(HStack)`
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
`

export const HeaderBackButton = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border: 1px solid ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.text};
  cursor: pointer;

  :hover {
    filter: brightness(1.15);
  }
`

export const HeaderIdentity = styled(HStack)`
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
`

export const HeaderTokenGroup = styled(HStack)`
  align-items: flex-end;
  gap: 0;
  flex: 0 0 auto;
`

export const PoolHeaderTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 22px;
  `}
`

export const PoolHeaderMeta = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
`

export const HeaderBadge = styled.div<{ $accent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme, $accent }) => ($accent ? theme.primary : theme.subText)};
  background: ${({ theme, $accent }) => ($accent ? rgba(theme.primary, 0.14) : rgba(theme.white, 0.04))};
  border: 1px solid ${({ theme, $accent }) => ($accent ? rgba(theme.primary, 0.35) : theme.tabActive)};
`

export const HeaderAside = styled(Stack)`
  align-items: flex-end;
  gap: 8px;
  min-width: 220px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    min-width: 100%;
  `}
`

export const HeaderAddress = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  background: ${({ theme }) => rgba(theme.white, 0.03)};
`

export const AddLiquidityContent = styled(HStack)`
  width: 100%;
  align-items: flex-start;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

export const AddLiquidityBody = styled(Stack)`
  width: 100%;
  gap: 16px;
`

export const AddLiquidityLayout = styled(HStack)`
  width: 100%;
  align-items: flex-start;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

export const AddLiquidityFormShell = styled(Stack)`
  width: 100%;
  max-width: 480px;
  flex: 0 0 480px;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 100%;
    flex: 1 1 auto;
  `}
`

export const AddLiquidityRouteShell = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

export const RouteMockFlow = styled(Stack)`
  gap: 12px;
`

export const RouteMockRow = styled(HStack)`
  align-items: center;
  gap: 10px;
`

export const RouteMockNode = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.06)};
  background: ${({ theme }) => rgba(theme.white, 0.03)};
`

export const RouteMockLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const RouteMockValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const RouteMockConnector = styled.div`
  width: 24px;
  height: 1px;
  background: ${({ theme }) => rgba(theme.white, 0.16)};
  flex: 0 0 auto;
`

export const RouteMockBranch = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 10px;
`

export const AddLiquidityWidgetShell = styled.div`
  width: 100%;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  background: ${({ theme }) => rgba(theme.background, 0.98)};
  overflow: hidden;

  .ks-lw {
    width: 100%;
  }

  .ks-lw > div:not(.hidden) {
    padding: 20px;
  }

  .ks-lw > div:not(.hidden) > .flex.text-xl.font-medium.justify-between.items-start,
  .ks-lw > div:not(.hidden) > .flex.justify-between.items-center.mt-4 {
    display: none;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 {
    margin-top: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:first-child,
  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:last-child {
    display: contents;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:last-child > :nth-child(1) {
    order: 2;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:first-child > :nth-child(1) {
    order: 3;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:first-child > :nth-child(2) {
    order: 4;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:first-child > :nth-child(3) {
    order: 5;
  }

  .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:last-child > :nth-child(n + 2) {
    display: none;
  }

  .ks-lw > div:not(.hidden) > .mt-6 {
    margin-top: 16px;
    justify-content: flex-start;
  }

  .ks-lw .setting {
    display: none;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 16px;

    .ks-lw > div:not(.hidden) {
      padding: 16px;
    }

    .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:first-child,
    .ks-lw > div:not(.hidden) > .mt-5.flex.gap-5 > div:last-child {
      display: block;
    }
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
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  padding: 20px;
  background: ${({ theme }) => rgba(theme.background, 0.98)};
  color: ${({ theme }) => theme.text};
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

export const SectionTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: 600;
`

export const SectionMeta = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 1.5;
`

export const SectionBlock = styled(Stack)`
  gap: 12px;
`

export const SectionBlockTitle = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const MetricWrap = styled(HStack)`
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
`

export const MetricTile = styled(Stack)`
  flex: 1 1 180px;
  min-width: 0;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 14px;
  background: ${({ theme }) => rgba(theme.white, 0.03)};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.05)};
`

export const MetricLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
  line-height: 1.4;
`

export const MetricValue = styled.div<{ $accent?: boolean }>`
  color: ${({ theme, $accent }) => ($accent ? theme.primary : theme.text)};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const MetricHint = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 1.4;
`

export const DetailPairWrap = styled(HStack)`
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
`

export const DetailCard = styled(Stack)`
  flex: 1 1 260px;
  min-width: 0;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: ${({ theme }) => rgba(theme.white, 0.03)};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.05)};
`

export const DetailLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
  line-height: 1.4;
`

export const DetailValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
`

export const ChartPlaceholder = styled.div`
  width: 100%;
  min-height: 220px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => rgba(theme.primary, 0.18)};
  background: linear-gradient(180deg, rgba(49, 203, 158, 0.08) 0%, rgba(49, 203, 158, 0.01) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 100% 100%, 48px 48px, 48px 48px;
  background-position: center, center, center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 1.6;
`

export const RouteStepList = styled(Stack)`
  gap: 10px;
`

export const RouteStepItem = styled(HStack)`
  align-items: flex-start;
  gap: 12px;
`

export const RouteStepIndex = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.primary, 0.16)};
  color: ${({ theme }) => theme.primary};
  font-size: 13px;
  font-weight: 600;
  flex: 0 0 auto;
`

export const RouteStepContent = styled(Stack)`
  gap: 4px;
  min-width: 0;
`

export const NoteCard = styled.div<{ $warning?: boolean }>`
  padding: 12px 14px;
  border-radius: 14px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  line-height: 1.6;
  background: ${({ theme, $warning }) => ($warning ? `${theme.warning}1f` : `${theme.primary}14`)};
  border: 1px solid ${({ theme, $warning }) => ($warning ? `${theme.warning}40` : `${theme.primary}26`)};
`

export const TokenLine = styled(HStack)`
  align-items: center;
  gap: 10px;
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
  padding: 20px;
  background: ${({ theme }) => rgba(theme.background, 0.98)};
  gap: 16px;
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
