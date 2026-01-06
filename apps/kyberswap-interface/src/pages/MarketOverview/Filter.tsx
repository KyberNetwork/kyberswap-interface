import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMemo } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { QueryParams } from 'services/marketOverview'

import Search from 'components/Search'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { Tag } from 'pages/Earns/PoolExplorer/styles'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { FilterRow, TagList } from 'pages/MarketOverview/styles'
import { MEDIA_WIDTHS } from 'theme'

const Filter = ({
  filters,
  updateFilters,
  input,
  setInput,
}: {
  filters: QueryParams
  updateFilters: (key: keyof QueryParams, value: string) => void
  input: string
  setInput: (value: string) => void
}) => {
  const { i18n } = useLingui()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [sortCol, sortDirection] = (filters.sort || '').split(' ')
  const isGainerActive = sortCol.includes('price_change_24h') && sortDirection === 'desc'
  const isLoserActive = sortCol.includes('price_change_24h') && sortDirection === 'asc'

  const filterTags = useMemo(
    () => [
      { label: t`Defi`, value: 'defi' },
      { label: t`Meme`, value: 'memes' },
      { label: t`AI`, value: 'ai-big-data' },
      { label: t`RWA`, value: 'real-world-assets' },
      { label: t`Game`, value: 'gaming' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.locale],
  )

  const chainOptions: MenuOption[] = MAINNET_NETWORKS.map(item => ({
    label: NETWORKS_INFO[item].name,
    value: item.toString(),
    icon: NETWORKS_INFO[item].icon,
  }))

  const handleChainChange = (value: string | number) => {
    const nextChainId = value.toString()
    updateFilters('chainId', nextChainId)
    if (sortCol.startsWith('price')) {
      updateFilters('sort', `${sortCol.split('-')[0]}-${nextChainId} ${sortDirection}`)
    }
  }

  return (
    <FilterRow>
      <DropdownMenu
        alignLeft
        options={chainOptions}
        value={filters.chainId?.toString() || ''}
        onChange={handleChainChange}
      />
      <TagList style={{ gap: '8px' }}>
        <Tag height={38} active={!filters.tags.length} onClick={() => updateFilters('tags', '')} role="button">
          <Trans>All</Trans>
        </Tag>
        <Tag
          height={38}
          active={!!filters.isFavorite}
          onClick={() => updateFilters('isFavorite', filters.isFavorite ? '' : 'true')}
          role="button"
        >
          <Star size={14} />
        </Tag>
        {filterTags.map(item => (
          <Tag
            height={38}
            active={
              ['gainers', 'losers'].includes(item.value)
                ? sortCol.includes('price_change_24h') && (item.value === 'gainers' ? 'desc' : 'asc') === sortDirection
                : filters.tags?.includes(item.value)
            }
            onClick={() => {
              if (['gainers', 'losers'].includes(item.value)) {
                updateFilters(
                  'sort',
                  (isGainerActive && item.value === 'gainers') || (isLoserActive && item.value === 'losers')
                    ? ''
                    : `price_change_24h-${filters.chainId} ${item.value === 'gainers' ? 'desc' : 'asc'}`,
                )
                return
              }
              if (filters.tags.includes(item.value)) {
                updateFilters('tags', filters.tags.filter(t => t !== item.value).join(','))
              } else {
                updateFilters('tags', [...filters.tags, item.value].join(','))
              }
            }}
            key={item.value}
            role="button"
          >
            {item.label}
          </Tag>
        ))}
      </TagList>
      <Search
        placeholder={t`Search by token name, symbol or address`}
        searchValue={input}
        allowClear
        onSearch={val => setInput(val)}
        style={{ height: '36px', width: upToSmall ? '100%' : '280px', marginLeft: 'auto' }}
      />
    </FilterRow>
  )
}

export default Filter
