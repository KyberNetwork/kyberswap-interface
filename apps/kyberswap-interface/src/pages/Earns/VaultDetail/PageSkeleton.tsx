import { useMedia } from 'react-use'

import {
  ActionBody,
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
  HowItWorks,
  PageWrapper,
  VaultMetaLeft,
  VaultMetaRow,
} from 'pages/Earns/VaultDetail/styles'
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import { VaultFieldsSkeleton } from 'pages/Earns/components/VaultFormSkeleton'
import { MEDIA_WIDTHS } from 'theme'

const CHART_COUNT = 2
const ACTION_TAB_COUNT = 2

/**
 * Stands in for the vault detail page while its data loads. It renders the page's own containers,
 * so the placeholder sits on exactly the grid the real content lands on and nothing shifts. The
 * action card borrows the deposit form's own placeholder, which is the tab the page opens on.
 */
const VaultDetailPageSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const chartHeight = upToXXSmall ? 170 : upToSmall ? 200 : 240

  return (
    <PageWrapper>
      <HeaderRow>
        <ValueSkeleton className="size-6 rounded-full" />
        <ValueSkeleton className="size-8 rounded-full" />
        <ValueSkeleton className="h-7 w-44" />
        <ValueSkeleton className="h-7 w-24" />
      </HeaderRow>

      <ContentGrid>
        <ChartsColumn>
          <ChartsCard>
            <VaultMetaRow>
              <VaultMetaLeft>
                <ValueSkeleton className="size-6 rounded-full" />
                <ValueSkeleton className="h-6 w-28" />
              </VaultMetaLeft>
              <ValueSkeleton className="h-6 w-40 rounded-lg" />
            </VaultMetaRow>

            <ChartsBody>
              {/* TVL then APY — same two sections, same period tabs, same chart box height. */}
              {Array.from({ length: CHART_COUNT }, (_, index) => (
                <ChartSection key={index}>
                  <ChartHeader>
                    <ValueSkeleton className="h-7 w-16" />
                    <ValueSkeleton className="h-7 w-40 rounded-3xl" />
                  </ChartHeader>
                  <ChartBox style={{ height: chartHeight }}>
                    <ValueSkeleton className="size-full rounded-lg" />
                  </ChartBox>
                </ChartSection>
              ))}
            </ChartsBody>

            {/* Two lines: the label and a description that wraps. */}
            <HowItWorks>
              <ValueSkeleton className="h-6 w-28" />
              <ValueSkeleton className="h-6 w-full" />
            </HowItWorks>
          </ChartsCard>
        </ChartsColumn>

        <ActionCard>
          <ActionTabs>
            {Array.from({ length: ACTION_TAB_COUNT }, (_, index) => (
              <ValueSkeleton key={index} className="mx-4 h-12 w-[116px] rounded-none" />
            ))}
          </ActionTabs>

          <ActionBody>
            <VaultFieldsSkeleton kind="deposit" />
            <ValueSkeleton className="mt-auto h-10 w-full rounded-[20px]" />
          </ActionBody>
        </ActionCard>
      </ContentGrid>
    </PageWrapper>
  )
}

export default VaultDetailPageSkeleton
