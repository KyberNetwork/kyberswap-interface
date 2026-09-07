import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Star } from 'react-feather'

import { ListingFilterTag, ListingFilterTagContainer } from 'components/Listing/components'
import Search from 'components/Search'
import { Center, HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useFilter from 'pages/MarketOverview/useFilter'
import { cn } from 'utils/cn'

const FILTER_TAGS = [
  { label: 'Defi', value: 'defi' },
  { label: 'Meme', value: 'memes' },
  { label: 'AI', value: 'ai-big-data' },
  { label: 'RWA', value: 'real-world-assets' },
  { label: 'Game', value: 'gaming' },
]

const MarketFilter = () => {
  const { filters, updateFilters } = useFilter()
  const { search, tags, isFavorite } = filters
  const [input, setInput] = useState(search || '')
  const debouncedInput = useDebounce(input, 300)
  const [sortColumn, sortDirection] = (filters.sort || '').split(' ')

  useEffect(() => {
    if (search !== debouncedInput) {
      updateFilters('search', debouncedInput || '')
    }
  }, [debouncedInput, search, updateFilters])

  const handleChainChange = (chainId: number) => {
    updateFilters('chainId', chainId.toString())

    if (sortColumn.startsWith('price')) {
      updateFilters('sort', `${sortColumn.split('-')[0]}-${chainId} ${sortDirection}`)
    }
  }

  return (
    <Stack className="gap-4">
      <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <ListingFilterTagContainer>
          <ListingFilterTag active={!tags.length} onClick={() => updateFilters('tags', '')}>
            <Trans>All</Trans>
          </ListingFilterTag>
          <ListingFilterTag
            active={!!isFavorite}
            aria-label="Favorite tokens"
            onClick={() => updateFilters('isFavorite', isFavorite ? '' : 'true')}
          >
            <Star size={14} />
          </ListingFilterTag>
          {FILTER_TAGS.map(item => (
            <ListingFilterTag
              active={tags.includes(item.value)}
              key={item.value}
              onClick={() =>
                updateFilters(
                  'tags',
                  tags.includes(item.value)
                    ? tags.filter(tag => tag !== item.value).join(',')
                    : [...tags, item.value].join(','),
                )
              }
            >
              {item.label}
            </ListingFilterTag>
          ))}
        </ListingFilterTagContainer>
        <Search
          allowClear
          onSearch={setInput}
          placeholder={t`Search by token name, symbol or address`}
          searchValue={input}
          style={{ height: '36px' }}
        />
      </HStack>

      <HStack className="items-center gap-3">
        <span className="shrink-0 whitespace-nowrap text-sm font-medium uppercase text-subText">
          <Trans>Chain</Trans>
        </span>
        <HStack className="min-w-0 flex-1 flex-wrap gap-2">
          {MAINNET_NETWORKS.map(chainId => {
            const network = NETWORKS_INFO[chainId]
            const active = filters.chainId === chainId

            return (
              <MouseoverTooltip text={network.name} key={chainId} placement="top" width="fit-content">
                <Center
                  as="button"
                  type="button"
                  aria-label={network.name}
                  aria-pressed={active}
                  className={cn(
                    'size-8 cursor-pointer rounded-lg border bg-background p-0 transition-colors',
                    active ? 'border-primary bg-primary-20' : 'border-transparent hover:bg-subText-20',
                  )}
                  onClick={() => handleChainChange(chainId)}
                >
                  <img src={network.icon} className="size-5" alt="" />
                </Center>
              </MouseoverTooltip>
            )
          })}
        </HStack>
      </HStack>
    </Stack>
  )
}

export default MarketFilter
