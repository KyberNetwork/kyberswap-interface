import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import Select, { SelectOption } from 'components/Select'
import useTheme from 'hooks/useTheme'
import { Z_INDEX_KYBER_AI } from 'pages/TrueSightV2/constants'

const categories: { [key: string]: SelectOption[] } = {
  categories: [
    { label: 'All Categories', value: '' },
    { label: 'Defi', value: 'defi' },
    { label: 'Gamefi', value: 'gamefi' },
    { label: 'Layer 2', value: 'layer2' },
  ],
  market_cap: [
    { label: 'All Market Cap', value: '' },
    { label: 'Less than $1M', value: '0,1000000' },
    { label: 'More than $1M', value: '1000000' },
    { label: 'More than $10M', value: '10000000' },
    { label: 'More than $100M', value: '100000000' },
    { label: 'More than $500M', value: '500000000' },
  ],
  holders: [
    { label: 'All Holders', value: '' },
    { label: 'Less than 1,000', value: '0,1000' },
    { label: 'More than 1,000', value: '1000' },
    { label: 'More than 10,000', value: '10000' },
  ],
  market: [
    { label: 'All Markets', value: '' },
    { label: 'DEXes', value: 'dexes' },
    { label: 'CEXes', value: 'cexes' },
  ],
  chain: [
    { label: 'All Chains', value: 'all' },
    { label: 'BNB Chain', value: 'bsc' },
  ],
}

const StyledSelect = styled(Select)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
`

export default function TokenFilter({
  handleFilterChange,
}: {
  handleFilterChange: (filter: Record<string, string>) => void
}) {
  const [filter, setFilter] = useState({})

  const onChangeFilter = (key: string, value: string) => {
    const newFilter = { ...filter, [key]: value }
    setFilter(newFilter)
    handleFilterChange(newFilter)
  }

  const listSelects = [
    { key: 'chain', label: 'Chains' },
    { key: 'market_cap', label: 'Market Cap' },
    { key: 'holders', label: 'Holders' },
    { key: 'categories', label: 'Categories' },
    { key: 'market', label: 'Markets' },
    // todo watch list
  ]

  const theme = useTheme()
  return (
    <Row gap="12px" padding={'0 16px'}>
      {listSelects.map(({ key, label }) => (
        <StyledSelect
          key={key}
          activeRender={item => (
            <Column gap="6px">
              <Text color={theme.subText} fontSize={'10px'}>
                {label}
              </Text>
              <Text color={theme.text} fontSize={'14px'}>
                {item?.label}
              </Text>
            </Column>
          )}
          options={categories[key]}
          onChange={value => onChangeFilter(key, value)}
          optionStyle={{ fontSize: '14px' }}
          menuStyle={{ zIndex: Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS, top: '60px' }}
        />
      ))}
    </Row>
  )
}
