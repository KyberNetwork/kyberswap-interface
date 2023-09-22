import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonGray } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Select from 'components/Select'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import SubscribeButtonKyberAI from 'pages/TrueSightV2/components/SubscireButtonKyberAI'
import { NETWORK_TO_CHAINID, SUPPORTED_NETWORK_KYBERAI, Z_INDEX_KYBER_AI } from 'pages/TrueSightV2/constants'
import { useGetFilterCategoriesQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'

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

const StyledSkeleton = styled(Skeleton)`
  ${shareStyle}
  width: 150px;
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

const getChainsFromSlugs = (values: string[] | undefined) =>
  (values || []).map(item => NETWORK_TO_CHAINID[item || '']).filter(Boolean)

export default function TokenFilter({
  handleFilterChange,
  setShowShare,
  onTrackingSelectChain,
  defaultFilter = {},
}: {
  handleFilterChange: (filter: Record<string, string>) => void
  setShowShare: (v: boolean) => void
  onTrackingSelectChain: (v: string) => void
  defaultFilter: { [k: string]: string }
}) {
  const [filter, setFilter] = useState(defaultFilter)

  const onChangeFilter = useCallback(
    (key: string, value: string) => {
      const newFilter = { ...filter, [key]: value }
      setFilter(newFilter)
      handleFilterChange(newFilter)
    },
    [setFilter, handleFilterChange, filter],
  )

  const { isLogin } = useSessionInfo()
  const { data = [], isFetching } = useGetFilterCategoriesQuery(undefined, { skip: !isLogin })
  const showLoading = useShowLoadingAtLeastTime(isFetching, 500)

  const { allChainIds, listSelects, chainFilter } = useMemo(() => {
    const [chainFilter, ...listSelects] = data
    const allChainIds = getChainsFromSlugs(chainFilter?.values.map(item => item.value + ''))

    return { allChainIds, listSelects, chainFilter }
  }, [data])

  const defaultChains = useMemo(
    () => getChainsFromSlugs(defaultFilter[chainFilter?.queryKey]?.split(',')),
    [defaultFilter, chainFilter],
  )

  // todo watch list chains

  const theme = useTheme()
  const [selectedChains, setSelectChains] = useState<ChainId[]>([])
  const handleChainChange = useCallback(
    (values: ChainId[]) => {
      if (!chainFilter?.queryKey) return
      setSelectChains(values)
      const selectAllChain = values.length === allChainIds.length
      const valueStr = selectAllChain ? '' : values.map(id => SUPPORTED_NETWORK_KYBERAI[id]).join(',')
      onTrackingSelectChain(selectAllChain ? 'All' : valueStr)
      onChangeFilter(chainFilter.queryKey, valueStr)
    },
    [chainFilter, onChangeFilter, allChainIds, onTrackingSelectChain],
  )

  const isInit = useRef(false)
  useEffect(() => {
    if (isInit.current || defaultChains.length + allChainIds.length === 0) return
    isInit.current = true
    setSelectChains(defaultChains.length ? defaultChains : allChainIds)
  }, [allChainIds, defaultChains])

  // todo loading de len filter
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const activeRender = (name: string, label: ReactNode) => (
    <Column gap="6px">
      <SelectName>{name}</SelectName>
      <Text color={theme.text} fontSize={'14px'} fontWeight={'500'} className="test">
        {label}
      </Text>
    </Column>
  )

  return (
    <StyledWrapper>
      <SelectGroup>
        {showLoading ? (
          new Array(5)
            .fill(0)
            .map((_, i) => <StyledSkeleton key={i} baseColor={theme.buttonBlack} highlightColor={theme.border} />)
        ) : (
          <>
            <StyledChainSelect
              menuStyle={{ left: 0, zIndex: Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS }}
              activeStyle={{
                backgroundColor: 'transparent',
                padding: 0,
              }}
              labelColor={theme.text}
              handleChangeChains={handleChainChange}
              chainIds={allChainIds}
              selectedChainIds={selectedChains}
              activeRender={node => activeRender('Chains', node)}
            />
            {listSelects.map(({ queryKey, displayName, values }) => (
              <StyledSelect
                value={filter[queryKey]}
                key={queryKey}
                activeRender={item => activeRender(displayName, item?.label)}
                options={values}
                onChange={value => onChangeFilter(queryKey, value)}
                optionStyle={{ fontSize: '14px' }}
                menuStyle={{
                  zIndex: Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS,
                  top: upToSmall ? undefined : SELECT_SIZE,
                  maxHeight: 400,
                  overflowY: 'scroll',
                }}
              />
            ))}
          </>
        )}
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
