import { Trans, t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import InfoHelper from 'components/InfoHelper'
import { SortBy } from 'pages/Earns/PoolExplorer'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { TableHeader as TableHeaderComponent } from 'pages/Earns/PoolExplorer/styles'
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
      <Text>{t`Protocol`}</Text>
      <Text>{t`Pair`}</Text>
      <Flex
        justifyContent="flex-start"
        sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
        role="button"
        onClick={() => onSortChange(SortBy.APR)}
      >
        {t`APR`}
        <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
      </Flex>
      {isFarmingFiltered && (
        <Flex justifyContent="flex-end" sx={{ gap: '4px', alignItems: 'center' }} role="button">
          {t`Max APR`}
          <InfoHelper
            text={t`Max APR is the highest active position APR in this pool recently. Click to the apr number to open the pre-filled same price range`}
          />
        </Flex>
      )}
      {isFarmingFiltered ? (
        <Flex justifyContent="flex-end" sx={{ gap: '4px', alignItems: 'center' }} role="button">
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
        </Flex>
      ) : (
        <Flex
          justifyContent="flex-end"
          sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
          role="button"
          onClick={() => onSortChange(SortBy.EARN_FEE)}
        >
          {t`Earn Fees`}
          <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
        </Flex>
      )}
      <Flex
        justifyContent="flex-end"
        sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
        role="button"
        onClick={() => onSortChange(SortBy.TVL)}
      >
        {t`TVL`}
        <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
      </Flex>
      <Flex
        justifyContent="flex-end"
        sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
        role="button"
        onClick={() => onSortChange(SortBy.VOLUME)}
      >
        {t`Volume`}
        <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
      </Flex>
      <div />
    </TableHeaderComponent>
  ) : null
}

export default TableHeader
