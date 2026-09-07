import { Trans, t } from '@lingui/macro'

import { ButtonEmpty } from 'components/Button'
import DropdownMenu, { MenuOption } from 'components/DropdownMenu'
import InfoHelper from 'components/InfoHelper'
import { TableCell, TableHeader, getMarketTableGridTemplateColumns } from 'components/Listing/Table'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MarketTableRow, Tab, Tabs } from 'pages/MarketOverview/styles'
import useFilter from 'pages/MarketOverview/useFilter'

export type PriceWindow = '1h' | '24h' | '7d'

const PRICE_WINDOW_OPTIONS: MenuOption[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
]

type MarketTableHeaderProps = {
  buyPriceWindow: PriceWindow
  sellPriceWindow: PriceWindow
  showMarketInfo: boolean
  onBuyPriceWindowChange: (window: PriceWindow) => void
  onSellPriceWindowChange: (window: PriceWindow) => void
  onShowMarketInfoChange: (showMarketInfo: boolean) => void
}

const MarketTableHeader = ({
  buyPriceWindow,
  sellPriceWindow,
  showMarketInfo,
  onBuyPriceWindowChange,
  onSellPriceWindowChange,
  onShowMarketInfoChange,
}: MarketTableHeaderProps) => {
  const { filters, updateFilters } = useFilter()
  const [sortColumn, sortDirection] = (filters.sort || '').split(' ')

  const updateSort = (column: string, appendChain = true) => {
    const nextColumn = appendChain ? `${column}-${filters.chainId}` : column
    let nextDirection: Direction | '' = Direction.DESC

    if (sortColumn === nextColumn) {
      if (sortDirection === Direction.DESC) nextDirection = Direction.ASC
      else if (sortDirection === Direction.ASC) nextDirection = ''
    }

    updateFilters('sort', nextDirection ? `${nextColumn} ${nextDirection}` : '')
  }

  const renderPriceChangeHeader = (
    side: 'buy' | 'sell',
    selectedWindow: PriceWindow,
    onWindowChange: (window: PriceWindow) => void,
  ) => (
    <TableCell className="flex-row items-center justify-end gap-1">
      <DropdownMenu
        flatten
        background="var(--ks-tabActive)"
        options={PRICE_WINDOW_OPTIONS}
        value={selectedWindow}
        width={30}
        usePortal
        onChange={value => {
          const window = value as PriceWindow
          onWindowChange(window)
          if (sortColumn.startsWith(`price_${side}_change`)) {
            updateFilters('sort', `price_${side}_change_${window}-${filters.chainId} ${sortDirection}`)
          }
        }}
      />
      <ButtonEmpty
        padding="6px"
        width="fit-content"
        onClick={() => updateSort(`price_${side}_change_${selectedWindow}`)}
      >
        <SortIcon sorted={sortColumn.startsWith(`price_${side}_change`) ? (sortDirection as Direction) : undefined} />
      </ButtonEmpty>
    </TableCell>
  )

  return (
    <>
      <TableHeader className="max-md:hidden" style={{ gridTemplateColumns: getMarketTableGridTemplateColumns() }}>
        <TableCell className="flex-row text-sm font-medium uppercase">
          <Trans>Name</Trans>
        </TableCell>
        <TableCell className="col-span-4 flex-row items-center justify-center text-sm font-medium uppercase">
          <Trans>On-chain Price</Trans>
        </TableCell>
        <TableCell className="col-span-2 flex-row items-center justify-center gap-1 text-sm font-medium uppercase">
          <Trans>Market Overview</Trans>
          <InfoHelper text={t`Market cap & 24h volume data sourced from Coingecko`} />
        </TableCell>
        <TableCell />
      </TableHeader>

      <MarketTableRow className="border-b border-tableHeader text-sm font-medium uppercase text-subText hover:bg-transparent max-md:hidden">
        <TableCell />
        <TableCell
          className="cursor-pointer flex-row items-center justify-end gap-1 hover:text-text hover:[&_svg_path]:stroke-text"
          role="button"
          onClick={() => updateSort('price_buy')}
        >
          <Trans>Buy Price</Trans>
          <SortIcon sorted={sortColumn.startsWith('price_buy-') ? (sortDirection as Direction) : undefined} />
        </TableCell>
        {renderPriceChangeHeader('buy', buyPriceWindow, onBuyPriceWindowChange)}
        <TableCell
          className="cursor-pointer flex-row items-center justify-end gap-1 hover:text-text hover:[&_svg_path]:stroke-text"
          role="button"
          onClick={() => updateSort('price_sell')}
        >
          <Trans>Sell Price</Trans>
          <SortIcon sorted={sortColumn.startsWith('price_sell-') ? (sortDirection as Direction) : undefined} />
        </TableCell>
        {renderPriceChangeHeader('sell', sellPriceWindow, onSellPriceWindowChange)}
        <TableCell
          className="cursor-pointer flex-row items-center justify-end gap-1 hover:text-text hover:[&_svg_path]:stroke-text"
          role="button"
          onClick={() => updateSort('volume_24h', false)}
        >
          <Trans>24h Volume</Trans>
          <SortIcon sorted={sortColumn === 'volume_24h' ? (sortDirection as Direction) : undefined} />
        </TableCell>
        <TableCell
          className="cursor-pointer flex-row items-center justify-end gap-1 hover:text-text hover:[&_svg_path]:stroke-text"
          role="button"
          onClick={() => updateSort('market_cap', false)}
        >
          <Trans>Market cap</Trans>
          <SortIcon sorted={sortColumn === 'market_cap' ? (sortDirection as Direction) : undefined} />
        </TableCell>
        <TableCell />
      </MarketTableRow>

      <div className="hidden border-b border-tableHeader max-md:block">
        <Tabs>
          <Tab role="button" active={!showMarketInfo} onClick={() => onShowMarketInfoChange(false)}>
            <Trans>On-chain Price</Trans>
          </Tab>
          <div className="h-5 border-r-2 border-border" />
          <Tab role="button" active={showMarketInfo} onClick={() => onShowMarketInfoChange(true)}>
            <Trans>Market Overview</Trans>
            <InfoHelper text={t`Market cap & 24h volume data sourced from Coingecko`} />
          </Tab>
        </Tabs>
      </div>
    </>
  )
}

export default MarketTableHeader
