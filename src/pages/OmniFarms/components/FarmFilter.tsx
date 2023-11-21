import { Trans, t } from '@lingui/macro'
import { Search } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Joint } from 'assets/svg/joint.svg'
import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import { ReactComponent as PartnerFarm } from 'assets/svg/partner-farm.svg'
import { ButtonOutlined } from 'components/Button'
import AgriCulture from 'components/Icons/AgriCulture'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import FarmSort from 'components/YieldPools/FarmPoolSort'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import { SearchContainer, SearchInput } from 'components/YieldPools/styleds'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useFarmFilters, { FarmStatus, FarmType, ProtocolType } from 'hooks/farms/useFarmFilters'
import useTheme from 'hooks/useTheme'

import { FilterGroup, FilterItem } from '../styled'

const FilterRow1 = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1.5rem',
})

const FilterRow2 = styled.div({
  marginTop: '0.75rem',
  gap: '1rem',
  display: 'flex',
})

export default function FarmFilter() {
  const { chainId: walletChainId } = useActiveWeb3React()
  const [{ type, protocol, search, chainIds, status }, setFarmFilters] = useFarmFilters()
  const theme = useTheme()

  return (
    <>
      <FilterRow1>
        <FilterGroup>
          <FilterItem active={type === FarmType.All} onClick={() => setFarmFilters({ type: FarmType.All })}>
            <Trans>All</Trans>
          </FilterItem>
          <FilterItem active={type === FarmType.Kyber} onClick={() => setFarmFilters({ type: FarmType.Kyber })}>
            <LogoKyber />
            <Trans>Kyber Farms</Trans>
          </FilterItem>
          <FilterItem active={type === FarmType.Joint} onClick={() => setFarmFilters({ type: FarmType.Joint })}>
            <Joint />
            <Trans>Joint Farms</Trans>
          </FilterItem>
          <FilterItem active={type === FarmType.Partner} onClick={() => setFarmFilters({ type: FarmType.Partner })}>
            <PartnerFarm />
            <Trans>Partner Farms</Trans>
          </FilterItem>
          <FilterItem active={type === FarmType.MyFarm} onClick={() => setFarmFilters({ type: FarmType.MyFarm })}>
            <AgriCulture />
            <Trans>My Farms</Trans>
          </FilterItem>
        </FilterGroup>

        <Flex sx={{ gap: '1rem' }}>
          <MultipleChainSelect
            style={{ height: '36px' }}
            chainIds={MAINNET_NETWORKS.map(i => i)}
            selectedChainIds={chainIds}
            handleChangeChains={value => {
              setFarmFilters({
                chainIds: value,
              })
            }}
          />
          <ButtonOutlined height="36px" padding="0 16px" onClick={() => setFarmFilters({ chainIds: [walletChainId] })}>
            <Trans>Current Chain</Trans>
          </ButtonOutlined>
        </Flex>
      </FilterRow1>

      <FilterRow2>
        <FilterGroup>
          <FilterItem
            active={protocol === ProtocolType.All}
            onClick={() => setFarmFilters({ protocol: ProtocolType.All })}
          >
            <Trans>All</Trans>
          </FilterItem>

          <FilterItem
            active={protocol === ProtocolType.Dynamic}
            onClick={() => setFarmFilters({ protocol: ProtocolType.Dynamic })}
          >
            <Trans>Dynamic Farms</Trans>
          </FilterItem>
          <FilterItem
            active={protocol === ProtocolType.Static}
            onClick={() => setFarmFilters({ protocol: ProtocolType.Static })}
          >
            <Trans>Static Farms</Trans>
          </FilterItem>
          <FilterItem
            active={protocol === ProtocolType.Classic}
            onClick={() => setFarmFilters({ protocol: ProtocolType.Classic })}
          >
            <Trans>Classic Farms</Trans>
          </FilterItem>
        </FilterGroup>

        <ListGridViewGroup />

        <FarmSort />

        <FilterGroup>
          <FilterItem
            active={status === FarmStatus.Active}
            onClick={() => setFarmFilters({ status: FarmStatus.Active })}
          >
            <Trans>Active</Trans>
          </FilterItem>
          <FilterItem active={status === FarmStatus.Ended} onClick={() => setFarmFilters({ status: FarmStatus.Ended })}>
            <Trans>Ended</Trans>
          </FilterItem>
        </FilterGroup>

        <SearchContainer style={{ flex: 1 }}>
          <SearchInput
            placeholder={t`Search by token name or pool address`}
            maxLength={255}
            value={search}
            onChange={e => setFarmFilters({ search: e.target.value.trim() })}
          />
          <Search color={theme.subText} size={16} />
        </SearchContainer>
      </FilterRow2>
    </>
  )
}
