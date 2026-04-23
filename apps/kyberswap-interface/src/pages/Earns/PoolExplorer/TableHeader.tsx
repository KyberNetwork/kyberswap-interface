import { Trans, t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { PoolQueryParams } from 'services/zapEarn'

import InfoHelper from 'components/InfoHelper'
import { SortBy } from 'pages/Earns/PoolExplorer'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import {
  HeaderInfoWrapper,
  HeaderText,
  SortableHeader,
  TableCell,
  TableHeader as TableHeaderComponent,
} from 'pages/Earns/PoolExplorer/styles'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

const TableHeader = ({
  onSortChange,
  filters,
}: {
  onSortChange: (sortBy: string) => void
  filters: PoolQueryParams
}) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const isFarmingFiltered = filters.tag === FilterTag.FARMING_POOL

  return !upToMedium ? (
    <TableHeaderComponent expandColumn={isFarmingFiltered}>
      <TableCell flexDirection="row">
        <HeaderText>{t`Pair`}</HeaderText>
      </TableCell>
      <TableCell flexDirection="row">
        <SortableHeader role="button" onClick={() => onSortChange(SortBy.APR)}>
          {t`APR`}
          <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
        </SortableHeader>
      </TableCell>
      <TableCell flexDirection="row">
        {isFarmingFiltered ? (
          <HeaderInfoWrapper role="button">
            {t`Max APR`}
            <InfoHelper
              text={t`Max APR is the highest active position APR in this pool recently. Click to the apr number to open the pre-filled same price range`}
            />
          </HeaderInfoWrapper>
        ) : (
          <SortableHeader role="button" onClick={() => onSortChange(SortBy.EARN_FEE)}>
            {t`Fee`}
            <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
          </SortableHeader>
        )}
      </TableCell>
      <TableCell flexDirection="row">
        {isFarmingFiltered ? (
          <HeaderInfoWrapper role="button">
            {t`EG Sharing`}
            <InfoHelper
              width="250px"
              text={
                <Trans>
                  The estimated amount of <b>Equilibrium Gain</b> rewards that would be shared with liquidity providers
                  during the selected time range
                </Trans>
              }
            />
          </HeaderInfoWrapper>
        ) : (
          <SortableHeader role="button" onClick={() => onSortChange(SortBy.TVL)}>
            {t`TVL`}
            <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
          </SortableHeader>
        )}
      </TableCell>
      <TableCell flexDirection="row">
        {isFarmingFiltered ? (
          <SortableHeader role="button" onClick={() => onSortChange(SortBy.TVL)}>
            {t`TVL`}
            <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
          </SortableHeader>
        ) : (
          <SortableHeader role="button" onClick={() => onSortChange(SortBy.VOLUME)}>
            {t`Volume`}
            <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
          </SortableHeader>
        )}
      </TableCell>
      <TableCell flexDirection="row">
        {isFarmingFiltered ? (
          <SortableHeader role="button" onClick={() => onSortChange(SortBy.VOLUME)}>
            {t`Volume`}
            <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
          </SortableHeader>
        ) : (
          <HeaderText>{t`Rewards`}</HeaderText>
        )}
      </TableCell>
      {isFarmingFiltered ? (
        <TableCell flexDirection="row">
          <HeaderText>{t`Rewards`}</HeaderText>
        </TableCell>
      ) : null}
      <TableCell />
      <TableCell />
    </TableHeaderComponent>
  ) : null
}

export default TableHeader
