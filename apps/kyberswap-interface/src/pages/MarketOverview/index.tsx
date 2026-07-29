import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketOverviewQuery } from 'services/tokenCatalog'

import { ListingPageDisclaimer, ListingPageTitle, ListingPageWrapper } from 'components/Listing/Page'
import { TableWrapper } from 'components/Listing/Table'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import { HiddenH1, HiddenH2 } from 'components/Seo/components'
import { Stack } from 'components/Stack'
import MarketFilter from 'pages/MarketOverview/Filter'
import TableContent from 'pages/MarketOverview/TableContent'
import MarketTableHeader, { PriceWindow } from 'pages/MarketOverview/TableHeader'
import useFilter from 'pages/MarketOverview/useFilter'

const MarketOverview = () => {
  const navigate = useNavigate()
  const { filters, updateFilters } = useFilter()
  const { data, isFetching, isLoading } = useMarketOverviewQuery(filters)
  const [showMarketInfo, setShowMarketInfo] = useState(false)
  const [buyPriceWindow, setBuyPriceWindow] = useState<PriceWindow>('24h')
  const [sellPriceWindow, setSellPriceWindow] = useState<PriceWindow>('24h')

  return (
    <ListingPageWrapper>
      <HiddenH1>Live token on-chain prices, trading volume, and market trends across multiple chains.</HiddenH1>
      <HiddenH2>Spot opportunities and jump straight into a trade from one dashboard.</HiddenH2>

      <Stack className="gap-2">
        <ListingPageTitle backLabel="Go back" onBack={() => navigate(-1)}>
          <Trans>Market Overview</Trans>
        </ListingPageTitle>
        <span className="italic text-subText">
          <Trans>
            The first-ever aggregated on-chain price platform, offering the most real-time, trade-able, and reliable
            price data.
          </Trans>
        </span>
      </Stack>

      <MarketFilter />

      <TableWrapper className="max-md:rounded-none max-md:bg-transparent">
        <MarketTableHeader
          buyPriceWindow={buyPriceWindow}
          sellPriceWindow={sellPriceWindow}
          showMarketInfo={showMarketInfo}
          onBuyPriceWindowChange={setBuyPriceWindow}
          onSellPriceWindowChange={setSellPriceWindow}
          onShowMarketInfoChange={setShowMarketInfo}
        />

        <div className="relative">
          <RefetchIndicator visible={isFetching && !isLoading} />
          <TableContent
            showMarketInfo={showMarketInfo}
            buyPriceSelectedField={buyPriceWindow}
            sellPriceSelectedField={sellPriceWindow}
          />
        </div>

        <Pagination
          onPageChange={(newPage: number) => updateFilters('page', newPage.toString())}
          totalCount={data?.data?.pagination?.totalItems || 0}
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 20}
        />
      </TableWrapper>

      <ListingPageDisclaimer>
        <Trans>
          Data and information on KyberSwap.com is for informational purposes only, neither recommendation nor
          investment advice is provided.
        </Trans>
      </ListingPageDisclaimer>
    </ListingPageWrapper>
  )
}

export default MarketOverview
