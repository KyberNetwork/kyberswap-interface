import { t } from '@lingui/macro'
import { Flex } from 'rebass'

import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import { APP_PATHS } from 'constants/index'

import DropdownMenu, { MenuOption } from '../PoolExplorer/DropdownMenu'
import { NavigateButton } from '../PoolExplorer/styles'
import { AllChainsOption, AllProtocolsOption } from '../useSupportedDexesAndChains'

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
  }
  onFilterChange: (key: string, value: string | number) => void
}) {
  return (
    <Flex alignItems={'center'} justifyContent={'space-between'}>
      <Flex sx={{ gap: 2 }}>
        <DropdownMenu
          alignLeft
          value={filters.chainIds}
          options={supportedChains.length ? supportedChains : [AllChainsOption]}
          onChange={value => value !== filters.chainIds && onFilterChange('chainIds', value)}
        />
        <DropdownMenu
          alignLeft
          value={filters.protocols}
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          onChange={value => value !== filters.protocols && onFilterChange('protocols', value)}
        />
      </Flex>
      <NavigateButton icon={<RocketIcon width={20} height={20} />} text={t`Explorer Pools`} to={APP_PATHS.EARN_POOLS} />
    </Flex>
  )
}
