import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import useFarmFilters, { FarmType } from 'hooks/farms/useFarmFilters'

const FilterRow1 = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1.5rem',
})

const FilterRow2 = styled.div({
  marginTop: '0.75rem',
  gap: '1rem',
})

const FilterGroup = styled.div(({ theme }) => ({
  display: 'flex',
  borderRadius: '999px',
  padding: '2px',
  border: `1px solid ${theme.border}`,
  width: 'fit-content',
}))

const FilterItem = styled.button<{ active: boolean }>(({ active, theme }) => ({
  all: 'unset',
  borderRadius: '999px',
  padding: '8px 10px',
  fontSize: '12px',
  fontWeight: '500',
  color: active ? theme.text : theme.subText,
  background: active ? theme.tabActive : 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}))

export default function FarmFilter() {
  const [{ farmType }, setFarmFilters] = useFarmFilters()

  return (
    <>
      <FilterRow1>
        <FilterGroup>
          <FilterItem active={farmType === FarmType.All} onClick={() => setFarmFilters({ farmType: FarmType.All })}>
            <Trans>All</Trans>
          </FilterItem>
          <FilterItem active={farmType === FarmType.Kyber} onClick={() => setFarmFilters({ farmType: FarmType.Kyber })}>
            <Trans>Kyber Farms</Trans>
          </FilterItem>
          <FilterItem active={farmType === FarmType.Joint} onClick={() => setFarmFilters({ farmType: FarmType.Joint })}>
            <Trans>Joint Farms</Trans>
          </FilterItem>
          <FilterItem
            active={farmType === FarmType.Partner}
            onClick={() => setFarmFilters({ farmType: FarmType.Partner })}
          >
            <Trans>Partner Farms</Trans>
          </FilterItem>
          <FilterItem
            active={farmType === FarmType.MyFarm}
            onClick={() => setFarmFilters({ farmType: FarmType.MyFarm })}
          >
            <Trans>My Farms</Trans>
          </FilterItem>
        </FilterGroup>
      </FilterRow1>
    </>
  )
}
