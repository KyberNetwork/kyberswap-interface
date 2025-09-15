import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { PoolQueryParams } from 'services/zapEarn'

import { ReactComponent as IconHighAprPool } from 'assets/svg/earn/ic_pool_high_apr.svg'
import { ReactComponent as IconHighlightedPool } from 'assets/svg/earn/ic_pool_highlighted.svg'
import { ReactComponent as IconLowVolatility } from 'assets/svg/earn/ic_pool_low_volatility.svg'
import { ReactComponent as IconSolidEarningPool } from 'assets/svg/earn/ic_pool_solid_earning.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import Search from 'components/Search'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { HeadSection, NavigateButton, Tag, TagContainer } from 'pages/Earns/PoolExplorer/styles'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import useSupportedDexesAndChains from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { MEDIA_WIDTHS } from 'theme'

export enum FilterTag {
  FARMING_POOL = 'farming_pool',
  HIGHLIGHTED_POOL = 'highlighted_pool',
  HIGH_APR = 'high_apr',
  SOLID_EARNING = 'solid_earning',
  LOW_VOLATILITY = 'low_volatility',
}

const filterTags = [
  {
    label: 'Farming Pools',
    value: FilterTag.FARMING_POOL,
    icon: <IconFarmingPool width={24} />,
    tooltip: 'No staking is required to earn rewards in these pools',
  },
  {
    label: 'Highlighted Pools',
    value: FilterTag.HIGHLIGHTED_POOL,
    icon: <IconHighlightedPool width={20} color="#FF007A" />,
    tooltip: 'Pools matching your wallet tokens or top volume pools if no wallet is connected',
  },
  {
    label: 'High APR',
    value: FilterTag.HIGH_APR,
    icon: <IconHighAprPool width={20} color="#31CB9E" />,
    tooltip: 'Top 100 Pools with assets that offer exceptionally high APRs',
  },
  {
    label: 'Solid Earning',
    value: FilterTag.SOLID_EARNING,
    icon: <IconSolidEarningPool width={20} color="#FBB324" />,
    tooltip: 'Top 100 pools that have the high total earned fee in the last 7 days',
  },
  {
    label: 'Low Volatility',
    value: FilterTag.LOW_VOLATILITY,
    icon: <IconLowVolatility width={20} color="#2C9CE4" />,
    tooltip: 'Top 100 highest TVL Pools consisting of stable coins or correlated pairs',
  },
]

export const timings: MenuOption[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
]

const Filter = ({
  filters,
  updateFilters,
  search,
  setSearch,
}: {
  filters: PoolQueryParams
  updateFilters: (key: keyof PoolQueryParams, value: string) => void
  search: string
  setSearch: (value: string) => void
}) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const memoizedFilterTags = useMemo(() => filterTags, [])

  const onChainChange = (newChainId: string | number) => {
    updateFilters('chainId', newChainId.toString())
  }
  const onProtocolChange = (newProtocol: string | number) => {
    updateFilters('protocol', newProtocol.toString())
  }
  const onIntervalChange = (newInterval: string | number) => {
    updateFilters('interval', newInterval.toString())
  }

  return (
    <>
      <HeadSection>
        <TagContainer>
          <Tag active={!filters.tag} role="button" onClick={() => updateFilters('tag', '')}>
            {t`All pools`}
          </Tag>
          <MouseoverTooltip text="List of pools added as favorite" placement="top" width="fit-content">
            <Tag active={filters.tag === 'favorite'} role="button" onClick={() => updateFilters('tag', 'favorite')}>
              <Star size={16} />
            </Tag>
          </MouseoverTooltip>
          {memoizedFilterTags.map((item, index) =>
            !upToMedium ? (
              <MouseoverTooltipDesktopOnly text={item.tooltip} placement="top" key={index}>
                <Tag
                  active={filters.tag === item.value}
                  key={item.value}
                  role="button"
                  onClick={() => updateFilters('tag', item.value)}
                >
                  {item.icon}
                  {item.label}
                </Tag>
              </MouseoverTooltipDesktopOnly>
            ) : (
              <Tag
                active={filters.tag === item.value}
                key={item.value}
                role="button"
                onClick={() => updateFilters('tag', item.value)}
              >
                {item.icon}
                {item.label}
              </Tag>
            ),
          )}
        </TagContainer>
        {!upToLarge && (
          <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
        )}
      </HeadSection>
      <Flex justifyContent="space-between" flexDirection={upToMedium ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Flex sx={{ gap: '1rem' }} flexWrap="wrap">
          <DropdownMenu
            options={supportedChains}
            value={filters.chainId.toString()}
            alignLeft
            onChange={onChainChange}
          />
          <DropdownMenu
            width={100}
            options={supportedDexes}
            value={filters.protocol}
            alignLeft
            onChange={onProtocolChange}
          />
          <DropdownMenu width={30} options={timings} value={filters.interval} onChange={onIntervalChange} />
        </Flex>
        <Search
          placeholder={t`Search by token symbol or pool/token address`}
          searchValue={search}
          allowClear
          onSearch={val => setSearch(val)}
          style={{ height: '36px' }}
        />
      </Flex>
    </>
  )
}

export default Filter
