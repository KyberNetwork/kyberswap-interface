import { useMedia } from 'react-use'

import {
  ActionCard,
  ActionTabs,
  ChartBox,
  ChartHeader,
  ChartSection,
  ChartsBody,
  ChartsCard,
  ChartsColumn,
  ContentGrid,
  HeaderRow,
  PageWrapper,
  VaultMetaLeft,
  VaultMetaRow,
} from 'pages/Earns/VaultDetail/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'

/**
 * Stands in for the vault detail page while its data loads. It renders the page's own containers,
 * so the placeholder sits on exactly the grid the real content lands on and nothing shifts.
 */
const VaultDetailPageSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const chartHeight = upToXXSmall ? 170 : upToSmall ? 200 : 240

  return (
    <PageWrapper>
      <HeaderRow>
        <PositionSkeleton width={24} height={24} />
        <PositionSkeleton width={32} height={32} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={180} height={28} />
        <div className="ml-auto flex flex-col items-end gap-1">
          <PositionSkeleton width={72} height={24} />
          <PositionSkeleton width={32} height={12} />
        </div>
      </HeaderRow>

      <ContentGrid>
        <ChartsColumn>
          <ChartsCard>
            <VaultMetaRow>
              <VaultMetaLeft>
                <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
                <PositionSkeleton width={150} height={20} />
              </VaultMetaLeft>
              <PositionSkeleton width={160} height={24} />
            </VaultMetaRow>

            <ChartsBody>
              {/* TVL then APY — same two sections, same period tabs, same chart box height. */}
              {Array.from({ length: 2 }, (_, index) => (
                <ChartSection key={index}>
                  <ChartHeader>
                    <PositionSkeleton width={index === 0 ? 140 : 44} height={18} />
                    <PositionSkeleton width={168} height={28} />
                  </ChartHeader>
                  <ChartBox>
                    <PositionSkeleton width="100%" height={chartHeight} />
                  </ChartBox>
                </ChartSection>
              ))}
            </ChartsBody>

            <PositionSkeleton width={420} height={20} />
          </ChartsCard>
        </ChartsColumn>

        <ActionCard>
          <ActionTabs>
            <PositionSkeleton width={148} height={48} />
            <PositionSkeleton width={148} height={48} />
          </ActionTabs>

          <div className="flex flex-1 flex-col gap-4 p-5 max-xxs:gap-3 max-xxs:p-4">
            {/* Amount field, then the summary rows, then the action button. */}
            <PositionSkeleton width="100%" height={104} />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <PositionSkeleton width={index === 3 ? 88 : 110} height={16} />
                <PositionSkeleton width={index === 3 ? 64 : 80} height={16} />
              </div>
            ))}
            <div className="mt-auto">
              <PositionSkeleton width="100%" height={44} />
            </div>
          </div>
        </ActionCard>
      </ContentGrid>
    </PageWrapper>
  )
}

export default VaultDetailPageSkeleton
