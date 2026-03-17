import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMemo } from 'react'
import { Plus, Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import { ReactComponent as IconHighAprPool } from 'assets/svg/earn/ic_pool_high_apr.svg'
import { ReactComponent as IconHighlightedPool } from 'assets/svg/earn/ic_pool_highlighted.svg'
import { ReactComponent as IconLowVolatility } from 'assets/svg/earn/ic_pool_low_volatility.svg'
import { ReactComponent as IconSolidEarningPool } from 'assets/svg/earn/ic_pool_solid_earning.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import { ButtonOutlined } from 'components/Button'
import Search from 'components/Search'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { HeadSection, NavigateButton, Tag, TagContainer } from 'pages/Earns/PoolExplorer/styles'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { default as MultiSelectDropdownMenu } from 'pages/Earns/components/DropdownMenu/MultiSelect'
import { ItemIcon } from 'pages/Earns/components/DropdownMenu/styles'
import useSupportedDexesAndChains, {
  AllChainsOption,
  AllProtocolsOption,
} from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { MEDIA_WIDTHS } from 'theme'

export enum FilterTag {
  FARMING_POOL = 'farming_pool',
  HIGHLIGHTED_POOL = 'highlighted_pool',
  HIGH_APR = 'high_apr',
  SOLID_EARNING = 'solid_earning',
  LOW_VOLATILITY = 'low_volatility',
}

export const timings: MenuOption[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
]

const tagToCategoryName = (tag: string) => {
  if (!tag) return 'all_pools'
  if (tag === 'favorite') return 'favorites'
  return tag
}

const Filter = ({
  filters,
  updateFilters,
  search,
  setSearch,
  onOpenCreatePool,
  totalItems,
}: {
  filters: PoolQueryParams
  updateFilters: (key: keyof PoolQueryParams, value: string) => void
  search: string
  setSearch: (value: string) => void
  onOpenCreatePool?: () => void
  totalItems?: number
}) => {
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const { i18n } = useLingui()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const selectedChainsLabel = useMemo(() => {
    const arrValue = filters.chainIds?.split(',').filter(Boolean)
    const selectedChains = supportedChains.filter(option => arrValue?.includes(option.value))
    if (selectedChains.length >= 1) {
      return (
        <Flex alignItems="center" sx={{ gap: '6px' }}>
          <Flex>
            {selectedChains.map((chain, index) => (
              <ItemIcon key={chain.value} src={chain.icon} alt={chain.label} style={{ marginLeft: index ? -8 : 0 }} />
            ))}
          </Flex>
          {selectedChains.length > 1 ? `Selected: ${selectedChains.length} chains` : selectedChains[0].label}
        </Flex>
      )
    }
    return AllChainsOption.label
  }, [supportedChains, filters.chainIds])

  const selectedProtocolsLabel = useMemo(() => {
    const arrValue = filters.protocol?.split(',').filter(Boolean)
    const selectedProtocols = supportedDexes.filter(option => arrValue?.includes(option.value))
    if (selectedProtocols.length >= 2) {
      return `Selected: ${selectedProtocols.length} protocols`
    }
    const option = selectedProtocols[0] || supportedDexes[0] || AllProtocolsOption
    return option?.label || t`All Protocols`
  }, [supportedDexes, filters.protocol])

  const filterTagOptions = useMemo(
    () => [
      {
        label: t`Farming Pools`,
        value: FilterTag.FARMING_POOL,
        icon: <IconFarmingPool width={24} />,
        tooltip: t`No staking is required to earn rewards in these pools`,
      },
      {
        label: t`Highlighted Pools`,
        value: FilterTag.HIGHLIGHTED_POOL,
        icon: <IconHighlightedPool width={20} color="#FF007A" />,
        tooltip: t`Pools matching your wallet tokens or top volume pools if no wallet is connected`,
      },
      {
        label: t`High APR`,
        value: FilterTag.HIGH_APR,
        icon: <IconHighAprPool width={20} color="#31CB9E" />,
        tooltip: t`Top 100 Pools with assets that offer exceptionally high APRs`,
      },
      {
        label: t`Solid Earning`,
        value: FilterTag.SOLID_EARNING,
        icon: <IconSolidEarningPool width={20} color="#FBB324" />,
        tooltip: t`Top 100 pools that have the high total earned fee in the last 7 days`,
      },
      {
        label: t`Low Volatility`,
        value: FilterTag.LOW_VOLATILITY,
        icon: <IconLowVolatility width={20} color="#2C9CE4" />,
        tooltip: t`Top 100 highest TVL Pools consisting of stable coins or correlated pairs`,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.locale],
  )

  const onChainChange = (value: string | number) => {
    trackingHandler(TRACKING_EVENT_TYPE.POOL_FILTER_APPLIED, {
      filter_type: 'chain',
      filter_value: value.toString(),
      previous_value: filters.chainIds || 'all',
      results_count: totalItems || 0,
      active_category: tagToCategoryName(filters.tag || ''),
      chain: value.toString(),
    })
    updateFilters('chainIds', value.toString())
  }
  const onProtocolChange = (newProtocol: string | number) => {
    trackingHandler(TRACKING_EVENT_TYPE.POOL_FILTER_APPLIED, {
      filter_type: 'protocol',
      filter_value: newProtocol.toString(),
      previous_value: filters.protocol || 'all',
      results_count: totalItems || 0,
      active_category: tagToCategoryName(filters.tag || ''),
      chain: filters.chainIds,
    })
    updateFilters('protocol', newProtocol.toString())
  }
  const onIntervalChange = (newInterval: string | number) => {
    trackingHandler(TRACKING_EVENT_TYPE.POOL_FILTER_APPLIED, {
      filter_type: 'time_period',
      filter_value: newInterval.toString(),
      previous_value: filters.interval || '24h',
      results_count: totalItems || 0,
      active_category: tagToCategoryName(filters.tag || ''),
      chain: filters.chainIds,
    })
    updateFilters('interval', newInterval.toString())
  }

  return (
    <>
      <HeadSection>
        <TagContainer>
          <Tag
            active={!filters.tag}
            role="button"
            onClick={() => {
              trackingHandler(TRACKING_EVENT_TYPE.POOL_CATEGORY_SELECTED, {
                category: 'all_pools',
                previous_category: tagToCategoryName(filters.tag || ''),
                results_count: totalItems || 0,
                chain: filters.chainIds,
              })
              updateFilters('tag', '')
            }}
          >
            {t`All pools`}
          </Tag>
          <MouseoverTooltip text={t`List of pools added as favorite`} placement="top" width="fit-content">
            <Tag
              active={filters.tag === 'favorite'}
              role="button"
              onClick={() => {
                trackingHandler(TRACKING_EVENT_TYPE.POOL_CATEGORY_SELECTED, {
                  category: 'favorites',
                  previous_category: tagToCategoryName(filters.tag || ''),
                  results_count: totalItems || 0,
                  chain: filters.chainIds,
                })
                updateFilters('tag', 'favorite')
              }}
            >
              <Star size={16} />
            </Tag>
          </MouseoverTooltip>
          {filterTagOptions.map((item, index) => {
            const handleTagClick = () => {
              trackingHandler(TRACKING_EVENT_TYPE.POOL_CATEGORY_SELECTED, {
                category: tagToCategoryName(item.value),
                previous_category: tagToCategoryName(filters.tag || ''),
                results_count: totalItems || 0,
                chain: filters.chainIds,
              })
              updateFilters('tag', item.value)
            }
            return !upToMedium ? (
              <MouseoverTooltipDesktopOnly text={item.tooltip} placement="top" key={index}>
                <Tag active={filters.tag === item.value} key={item.value} role="button" onClick={handleTagClick}>
                  {item.icon}
                  {item.label}
                </Tag>
              </MouseoverTooltipDesktopOnly>
            ) : (
              <Tag active={filters.tag === item.value} key={item.value} role="button" onClick={handleTagClick}>
                {item.icon}
                {item.label}
              </Tag>
            )
          })}
        </TagContainer>
        {!upToLarge && (
          <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
        )}
      </HeadSection>
      <Flex justifyContent="space-between" flexDirection={upToMedium ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Flex sx={{ gap: '1rem' }} flexWrap="wrap">
          <MultiSelectDropdownMenu
            alignItems="flex-start"
            highlightOnSelect
            label={selectedChainsLabel}
            options={supportedChains.length ? supportedChains : [AllChainsOption]}
            value={filters.chainIds || ''}
            onChange={value => onChainChange(value)}
          />
          <MultiSelectDropdownMenu
            alignItems="flex-start"
            highlightOnSelect
            label={selectedProtocolsLabel}
            options={supportedDexes}
            value={filters.protocol}
            onChange={value => onProtocolChange(value)}
          />
          <DropdownMenu width={30} options={timings} value={filters.interval || '24h'} onChange={onIntervalChange} />
        </Flex>
        <Flex alignItems={upToMedium ? 'stretch' : 'center'} style={{ gap: '12px' }} flexWrap="wrap">
          <Search
            placeholder={t`Search by token symbol or pool/token address`}
            searchValue={search}
            allowClear
            onSearch={val => setSearch(val)}
            style={{ height: '36px', width: upToMedium ? '100%' : '280px' }}
          />
          <ButtonOutlined
            color={theme.primary}
            borderRadius="16px"
            height="32px"
            onClick={() => {
              trackingHandler(TRACKING_EVENT_TYPE.CREATE_POOL_CLICKED, {
                chain: filters.chainIds,
                active_category: tagToCategoryName(filters.tag || ''),
              })
              onOpenCreatePool?.()
            }}
            style={{
              width: upToMedium ? '100%' : 'fit-content',
              gap: '4px',
              padding: '0 16px',
            }}
          >
            <Plus size={16} />
            <Trans>Create Pool</Trans>
          </ButtonOutlined>
        </Flex>
      </Flex>
    </>
  )
}

export default Filter
