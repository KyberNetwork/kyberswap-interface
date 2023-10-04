import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import { ButtonGray } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Select from 'components/Select'
import { EMPTY_OBJECT } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import SubscribeButtonKyberAI from 'pages/TrueSightV2/components/SubscireButtonKyberAI'
import WatchlistSelect from 'pages/TrueSightV2/components/TokenFilter/WatchlistSelect'
import {
  KYBERAI_LISTYPE_TO_MIXPANEL,
  NETWORK_TO_CHAINID,
  SUPPORTED_NETWORK_KYBERAI,
  Z_INDEX_KYBER_AI,
} from 'pages/TrueSightV2/constants'
import { useGetFilterCategoriesQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { KyberAIListType } from 'pages/TrueSightV2/types'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'

const SELECT_SIZE = '60px'

const shareStyle = css`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  height: ${SELECT_SIZE};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 36px;
    padding-top: 6px;
    padding-bottom: 6px;
  `}
`

const StyledSkeleton = styled(Skeleton)`
  ${shareStyle}
  width: 150px;
`

export const StyledSelect = styled(Select)`
  ${shareStyle}
`

const StyledChainSelect = styled(MultipleChainSelect)`
  ${shareStyle}
  padding: 12px;
  background: ${({ theme }) => theme.buttonBlack};
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
    z-index: ${Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS};
    background: ${theme.background}
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
    padding-right: 100px;
  `}
`

const getChainsFromSlugs = (values: string[] | undefined) =>
  (values || []).map(item => NETWORK_TO_CHAINID[item || '']).filter(Boolean)

export const ActiveSelectItem = ({ name, label }: { name: string; label: ReactNode }) => {
  const theme = useTheme()
  return (
    <Column gap="6px">
      <SelectName>{name}</SelectName>
      <Text color={theme.text} fontSize={'14px'} fontWeight={'500'} className="test">
        {label}
      </Text>
    </Column>
  )
}

export default function TokenFilter({
  handleFilterChange,
  setShowShare,
  filter = EMPTY_OBJECT,
  listType,
}: {
  handleFilterChange: (filter: Record<string, string>) => void
  setShowShare: (v: boolean) => void
  filter: { [k: string]: string }
  listType: KyberAIListType
}) {
  const onChangeFilter = useCallback(
    (key: string, value: string) => {
      handleFilterChange({ ...filter, [key]: value })
    },
    [handleFilterChange, filter],
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
    () => getChainsFromSlugs(filter[chainFilter?.queryKey]?.split(',')),
    [filter, chainFilter],
  )

  const mixpanelHandler = useMixpanelKyberAI()
  const onTrackingSelectChain = useCallback(
    (network: string) => {
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_SWITCH_CHAIN_CLICK, {
        source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
        network,
      })
    },
    [listType, mixpanelHandler],
  )

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

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const menuStyle: CSSProperties = {
    zIndex: Z_INDEX_KYBER_AI.FILTER_TOKEN_OPTIONS,
    top: upToSmall ? undefined : SELECT_SIZE,
    maxHeight: 400,
    overflowY: 'scroll',
  }

  const isWatchlistTab = listType === KyberAIListType.MYWATCHLIST

  const [scrolling, setScrolling] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // why we need it: z-index of select not working with scroll container
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let touchstartX = 0
    const onStart = (e: TouchEvent) => {
      touchstartX = e.changedTouches?.[0]?.screenX
    }
    const onEnd = (e: TouchEvent) => {
      const touchendX = e.changedTouches?.[0]?.screenX
      if (Math.abs(touchendX - touchstartX) > 5) {
        setScrolling(true)
      }
    }
    node?.addEventListener('touchstart', onStart)
    node?.addEventListener('touchend', onEnd)
    return () => {
      node?.removeEventListener('touchstart', onStart)
      node?.removeEventListener('touchend', onEnd)
    }
  }, [])

  return (
    <StyledWrapper>
      <SelectGroup
        ref={ref}
        style={{ overflowX: scrolling ? 'scroll' : undefined }}
        onClick={() => setScrolling(false)}
      >
        {showLoading ? (
          new Array(isWatchlistTab ? 5 : 4)
            .fill(0)
            .map((_, i) => <StyledSkeleton key={i} baseColor={theme.background} highlightColor={theme.border} />)
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
              activeRender={node => <ActiveSelectItem name={'Chains'} label={node} />}
            />
            {listSelects.map(({ queryKey, displayName, values }) => (
              <StyledSelect
                value={filter[queryKey]}
                key={queryKey}
                activeRender={item => <ActiveSelectItem name={displayName} label={item?.label} />}
                options={values}
                onChange={value => onChangeFilter(queryKey, value)}
                optionStyle={{ fontSize: '14px' }}
                menuStyle={menuStyle}
              />
            ))}
            {isWatchlistTab && (
              <WatchlistSelect
                value={filter['watchlist']}
                onChange={value => onChangeFilter('watchlist', value)}
                menuStyle={menuStyle}
              />
            )}
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
            backgroundColor: theme.tableHeader,
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
