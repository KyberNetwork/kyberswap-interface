import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Select, { SelectOption } from 'components/Select'
import useTheme from 'hooks/useTheme'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import SubscribeButtonKyberAI from 'pages/TrueSightV2/components/SubscireButtonKyberAI'
import { NETWORK_TO_CHAINID, Z_INDEX_KYBER_AI } from 'pages/TrueSightV2/constants'
import { MEDIA_WIDTHS } from 'theme'

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

const SELECT_SIZE = '60px'

const shareStyle = css`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  height: ${SELECT_SIZE} !important;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: unset !important;
    padding-top: 6px;
    padding-bottom: 6px;
  `}
`

const StyledSelect = styled(Select)`
  ${shareStyle}
`

const StyledChainSelect = styled(MultipleChainSelect)`
  ${shareStyle}
  padding: 12px;
`

const SelectName = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 10px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const StyledWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  width: 100%;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: relative;
  `}
`

const ShareGroup = styled.div`
  width: fit-content;
  gap: 12px;
  display: flex;
  height: ${SELECT_SIZE};
  align-self: flex-end;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: unset;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 0 12px;
    background: ${theme.buttonBlack}
  `}
`

const SelectGroup = styled.div`
  width: fit-content;
  gap: 12px;
  display: flex;
  height: ${SELECT_SIZE};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: relative;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    overflow-x: scroll;
  `}
`

export default function TokenFilter({
  handleFilterChange,
  handleChainChange,
  setShowShare,
}: {
  handleFilterChange: (filter: Record<string, string>) => void
  handleChainChange: (v?: ChainId) => void
  setShowShare: (v: boolean) => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
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

  const activeRender = (name: string, label: ReactNode) => (
    <Column gap="6px">
      <SelectName>{name}</SelectName>
      <Text color={theme.text} fontSize={'14px'} fontWeight={'500'} className="test">
        {label}
      </Text>
    </Column>
  )

  const theme = useTheme()
  const [selectedChains, setSelectChains] = useState<ChainId[]>(Object.values(NETWORK_TO_CHAINID))

  return (
    <StyledWrapper>
      <SelectGroup>
        <StyledChainSelect
          menuStyle={{ left: 0 }}
          activeStyle={{
            backgroundColor: 'transparent',
            padding: 0,
          }}
          labelColor={theme.text}
          handleChangeChains={setSelectChains}
          chainIds={Object.values(NETWORK_TO_CHAINID)}
          selectedChainIds={selectedChains}
          activeRender={node => activeRender('Chains', node)}
        />
        {listSelects.map(({ key, label }) => (
          <StyledSelect
            key={key}
            activeRender={item => activeRender(label, item?.label)}
            options={categories[key]}
            onChange={value => onChangeFilter(key, value)}
            optionStyle={{ fontSize: '14px' }}
            menuStyle={{ zIndex: Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS, top: upToSmall ? undefined : SELECT_SIZE }}
          />
        ))}
      </SelectGroup>
      <ShareGroup>
        <ButtonGray
          color={theme.subText}
          gap="4px"
          width="36px"
          height="36px"
          padding="6px"
          style={{
            filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))',
            flexShrink: 0,
            backgroundColor: theme.background,
          }}
          onClick={() => setShowShare(true)}
        >
          <Icon size={16} id="share" />
        </ButtonGray>
        <SubscribeButtonKyberAI source="ranking" />
      </ShareGroup>
    </StyledWrapper>
  )
}
