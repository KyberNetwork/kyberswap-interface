import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { PositionStatus } from 'services/zapEarn'

import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import { APP_PATHS } from 'constants/index'
import { MEDIA_WIDTHS } from 'theme'

import DropdownMenu, { MenuOption } from '../PoolExplorer/DropdownMenu'
import { NavigateButton } from '../PoolExplorer/styles'
import { AllChainsOption, AllProtocolsOption } from '../useSupportedDexesAndChains'

const POSITION_STATUS = [
  { label: 'All Positions', value: '' },
  { label: 'In Range', value: PositionStatus.IN_RANGE },
  { label: 'Out Range', value: PositionStatus.OUT_RANGE },
]

export default function Filter({
  supportedChains,
  supportedDexes,
  filters,
  onFilterChange,
}: {
  supportedChains: MenuOption[]
  supportedDexes: MenuOption[]
  filters: {
    addresses: string
    chainIds: string
    protocols: string
    status: string
  }
  onFilterChange: (key: string, value: string | number) => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Flex
      flexDirection={upToSmall ? 'column-reverse' : 'row'}
      alignItems={'center'}
      justifyContent={'space-between'}
      sx={{ gap: 2 }}
    >
      <Flex sx={{ gap: 2, width: upToSmall ? '100%' : 'auto' }}>
        <DropdownMenu
          alignLeft
          mobileFullWidth
          value={filters.chainIds}
          options={supportedChains.length ? supportedChains : [AllChainsOption]}
          onChange={value => value !== filters.chainIds && onFilterChange('chainIds', value)}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          value={filters.protocols}
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          onChange={value => value !== filters.protocols && onFilterChange('protocols', value)}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          value={filters.status}
          options={POSITION_STATUS}
          onChange={value => value !== filters.status && onFilterChange('status', value)}
        />
      </Flex>
      <NavigateButton
        mobileFullWidth
        icon={<RocketIcon width={20} height={20} />}
        text={t`Explore Pools`}
        to={APP_PATHS.EARN_POOLS}
      />
    </Flex>
  )
}
