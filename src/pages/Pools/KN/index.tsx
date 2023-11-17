import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetAllPoolsQuery } from 'services/knprotocol'
import styled from 'styled-components'

import statsBackground from 'assets/images/stats-bg.png'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonOutlined } from 'components/Button'
import Search from 'components/Search'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { MouseoverTooltip } from 'components/Tooltip'
import { PoolTitleContainer, TabGroup } from 'components/YieldPools/styleds'
import { APP_PATHS } from 'constants/index'
import { EVM_MAINNET_NETWORKS, EVM_NETWORK, isEVM } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useGlobalData } from 'state/about/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import PoolList from './PoolList'
import {
  ITEM_PER_PAGE,
  PoolTimeframe,
  PoolType,
  poolProtocolText,
  poolTimeframeText,
  poolTypeText,
  poolViewIcon,
} from './const'
import { ButtonPrimaryWithHighlight, PoolsPageWrapper, Tab } from './styleds'

const StatsWrapper = styled(Flex)`
  padding: 16px;

  position: relative;
  &:before {
    content: ' ';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.4;
    z-index: -1;
    background: #31cb9e4d url(${statsBackground});
    background-size: cover;
    border-radius: 16px;
  }
`

const SText = styled(Text)``

const CreatePoolLink = styled(StyledInternalLink)`
  display: flex;
  gap: 4px;
  flex-direction: column;
  padding: 8px;
  border-radius: 8px;
  color: unset;
  text-decoration: none !important;
  &:hover {
    background-color: ${({ theme }) => theme.background};
  }

  & > ${SText}:first-child {
    font-size: 16px;
    font-weight: 500;
    line-height: 24px; /* 150% */
  }
  & > ${SText}:nth-child(2) {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px; /* 133.333% */
  }
`
const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  width: 20px;
  height: 20px;
`
const Stat = styled(Flex)`
  display: flex;
  padding: 12px;

  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.64);
  width: 100%;
  border-radius: 28px;
`
const networkList = EVM_MAINNET_NETWORKS

const validateParams = (
  searchParams: URLSearchParams,
): {
  chainIds: EVM_NETWORK[]
  search: string
  page: number
  protocol: '' | VERSION.ELASTIC | VERSION.CLASSIC
  type: '' | PoolType
  sortBy: '' | 'apr' | 'tvl' | 'volume' | 'fees' | 'id'
  sortType: '' | 'asc' | 'desc'
  timeframe: '24h' | '7d' | '30d'
  highlightCreateButton: boolean
  view: 'list' | 'grid'
} => {
  const chainIds: EVM_NETWORK[] = (searchParams.get('chains') || '').split(',').map(Number).filter(isEVM)
  const type: string = searchParams.get('type') || ''
  const page: number = parseInt(searchParams.get('page') || '')
  const protocol: string = searchParams.get('protocol') || ''
  const sortBy: string = (searchParams.get('sortBy') || '').toLowerCase()
  const sortType: string = (searchParams.get('sortType') || '').toLowerCase()
  const search: string = searchParams.get('search') || ''
  const view: string = searchParams.get('view') || ''
  const highlightCreateButton: string = searchParams.get('highlightCreateButton') || ''
  const timeframe: string = searchParams.get('timeframe') || ''
  const poolType: PoolType | '' =
    type === PoolType.STABLES
      ? PoolType.STABLES
      : type === PoolType.LSDS
      ? PoolType.LSDS
      : type === PoolType.FARMING_POOLS
      ? PoolType.FARMING_POOLS
      : type === PoolType.MY_POSITIONS
      ? PoolType.MY_POSITIONS
      : ''
  const poolProtocol: VERSION.ELASTIC | VERSION.CLASSIC | '' =
    protocol === VERSION.ELASTIC ? VERSION.ELASTIC : protocol === VERSION.CLASSIC ? VERSION.CLASSIC : ''

  return {
    chainIds: chainIds.length ? chainIds : networkList,
    search,
    page: isNaN(page) ? 1 : page,
    protocol: poolProtocol,
    type: poolType,
    sortBy: (['apr', 'tvl', 'volume', 'fees', 'id'] as const).includes(sortBy) ? sortBy : ('' as const),
    sortType: (['asc', 'desc'] as const).includes(sortType) ? sortType : ('' as const),
    timeframe: (['24h', '7d', '30d'] as const).includes(timeframe) ? timeframe : ('24h' as const),
    highlightCreateButton: highlightCreateButton === 'true',
    view: (['list', 'grid'] as const).includes(view) ? view : ('grid' as const),
  }
}

const KNPools = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { chainIds, search, page, protocol, type, sortBy, sortType, timeframe, highlightCreateButton, view } =
    validateParams(searchParams)

  const { chainId } = useActiveWeb3React()

  const { currentData, isLoading } = useGetAllPoolsQuery({
    chainIds: chainIds.length ? chainIds : isEVM(chainId) ? [chainId] : [],
    search,
    page,
    size: ITEM_PER_PAGE,
    protocol,
    type: type !== PoolType.MY_POSITIONS ? type : '',
    sortBy,
    sortType,
    timeframe,
  })

  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const data = useGlobalData()

  const [searchState, setSearchState] = useState(search)

  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  useEffect(() => {
    const sync = () => {
      if (searchState) searchParamsRef.current.set('search', searchState)
      else searchParamsRef.current.delete('search')
      setSearchParams(searchParamsRef.current, { replace: true })
    }
    const timeoutToken = setTimeout(sync, 100)
    return () => {
      clearTimeout(timeoutToken)
    }
  }, [searchState, setSearchParams])

  const onSelectChains = useCallback(
    (chains: ChainId[]) => {
      if (chains?.length) searchParams.set('chains', chains.join(','))
      else searchParams.delete('chains')
      setSearchParams(searchParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const isValidNetwork = networkList.includes(chainId)
  const handleClickCurrentChain = () => {
    if (!isValidNetwork) return

    searchParams.set('chains', String(chainId))
    setSearchParams(searchParams, { replace: true })
  }

  if (!isEVM) return <Navigate to="/" />

  const responsiveFilterGroup = upToSmall ? null : (
    <>
      <Flex justifyContent="space-between" sx={{ gap: '24px' }} flexDirection={upToMedium ? 'column' : 'row'}>
        <TabGroup>
          {(['', PoolType.STABLES, PoolType.LSDS, PoolType.FARMING_POOLS, PoolType.MY_POSITIONS] as const).map(
            poolType => {
              const tab = (
                <Tab
                  onClick={() => {
                    if (poolType) searchParams.set('type', poolType)
                    else searchParams.delete('type')
                    setSearchParams(searchParams, { replace: true })
                  }}
                  active={poolType === type}
                  key={poolType}
                >
                  <PoolTitleContainer>{poolTypeText[poolType]}</PoolTitleContainer>
                </Tab>
              )
              if (poolType === PoolType.LSDS)
                return (
                  <MouseoverTooltip
                    text={t`Liquid staking derivates (e.g. wstETH)`}
                    placement="top"
                    width="max-content"
                  >
                    {tab}
                  </MouseoverTooltip>
                )
              return tab
            },
          )}
        </TabGroup>
        <Flex sx={{ gap: '0.75rem' }} width={upToExtraSmall ? '100%' : undefined}>
          <MultipleChainSelect
            style={{ height: 36 }}
            handleChangeChains={onSelectChains}
            chainIds={networkList}
            selectedChainIds={chainIds}
          />
          <ButtonOutlined
            onClick={handleClickCurrentChain}
            disabled={!isValidNetwork}
            padding="0 16px"
            style={{
              height: '36px',
              flex: upToExtraSmall ? 1 : '0 0 fit-content',
            }}
          >
            <Trans>Current Chain</Trans>
          </ButtonOutlined>
        </Flex>
      </Flex>
      <Flex sx={{ gap: '24px' }} flexDirection={upToMedium ? 'column' : 'row'} width="100%">
        <Flex sx={{ gap: '24px' }}>
          <TabGroup>
            {(['', VERSION.ELASTIC, VERSION.CLASSIC] as const).map(poolProtocol => (
              <Tab
                onClick={() => {
                  if (poolProtocol) searchParams.set('protocol', poolProtocol)
                  else searchParams.delete('protocol')
                  setSearchParams(searchParams, { replace: true })
                }}
                active={poolProtocol === protocol}
                key={poolProtocol}
              >
                <PoolTitleContainer>{poolProtocolText[poolProtocol]}</PoolTitleContainer>
              </Tab>
            ))}
          </TabGroup>
          <TabGroup>
            {([VIEW_MODE.GRID, VIEW_MODE.LIST] as const).map(poolView => (
              <Tab
                onClick={() => {
                  if (poolView) searchParams.set('view', poolView)
                  else searchParams.delete('view')
                  setSearchParams(searchParams, { replace: true })
                }}
                active={poolView === view}
                key={poolView}
                color={poolView === view ? theme.primary : undefined}
              >
                <PoolTitleContainer>{poolViewIcon[poolView]}</PoolTitleContainer>
              </Tab>
            ))}
          </TabGroup>
          <MouseoverTooltip
            text={t`View volume, fees and APR of pools by different timeframes`}
            placement="top"
            width="max-content"
          >
            <TabGroup>
              {([PoolTimeframe.D1, PoolTimeframe.D7, PoolTimeframe.D30] as const).map(poolTimeframe => (
                <Tab
                  onClick={() => {
                    if (poolTimeframe) searchParams.set('timeframe', poolTimeframe)
                    else searchParams.delete('timeframe')
                    setSearchParams(searchParams, { replace: true })
                  }}
                  active={poolTimeframe === timeframe}
                  key={poolTimeframe}
                >
                  <PoolTitleContainer>{poolTimeframeText[poolTimeframe]}</PoolTitleContainer>
                </Tab>
              ))}
            </TabGroup>
          </MouseoverTooltip>
        </Flex>
        <Search
          style={{ width: 'unset', flex: 1, backgroundColor: 'unset', border: `1px solid ${theme.border}` }}
          searchValue={searchState}
          onSearch={search => {
            setSearchState(search)
          }}
          placeholder={t`Search by token name or pool address`}
        />
      </Flex>
    </>
  )

  return (
    <>
      <PoolsPageWrapper>
        <Flex>
          <Text fontSize={24} fontWeight={500} lineHeight="28px">
            <Trans>Pools</Trans>
          </Text>
        </Flex>
        <StatsWrapper>
          <Flex sx={{ gap: '16px' }} flexDirection="column" width="100%">
            <Flex
              justifyContent="space-between"
              width="100%"
              sx={{ gap: upToSmall ? '16px' : '32px' }}
              flexDirection={upToSmall ? 'column' : 'row'}
            >
              <Flex alignItems="center">
                <Text fontSize={16} fontWeight={500} lineHeight="24px">
                  <Trans>
                    Contribute liquidity to our pools to earn trading fees and get additional rewards from our farms!{' '}
                    <ExternalLink href="//todo namgold">Read more here ↗</ExternalLink>
                  </Trans>
                </Text>
              </Flex>
              <MouseoverTooltip
                text={
                  <Flex sx={{ gap: '4px' }} flexDirection="column">
                    <CreatePoolLink to={APP_PATHS.ELASTIC_CREATE_POOL}>
                      <SText color={theme.text}>
                        <Trans>Elastic Position</Trans>
                      </SText>
                      <SText color={theme.subText}>
                        <Trans>Create an Elastic Pool</Trans>
                      </SText>
                    </CreatePoolLink>
                    <CreatePoolLink to={APP_PATHS.CLASSIC_CREATE_POOL}>
                      <SText color={theme.text}>
                        <Trans>Classic Position</Trans>
                      </SText>
                      <SText color={theme.subText}>
                        <Trans>Create a Classic Pool</Trans>
                      </SText>
                    </CreatePoolLink>
                  </Flex>
                }
                width="200px"
                padding="12px"
                placement="bottom"
                style={{ borderRadius: '16px' }}
              >
                <Link to={APP_PATHS.ELASTIC_CREATE_POOL}>
                  <ButtonPrimaryWithHighlight
                    data-highlight={highlightCreateButton}
                    sx={{ whiteSpace: 'nowrap', border: 'none !important', padding: '8px 16px !important' }}
                  >
                    <Flex sx={{ gap: '8px' }} alignItems="center">
                      <Text>
                        <Trans>Create Pool</Trans>
                      </Text>{' '}
                      <DropdownIcon />
                    </Flex>
                  </ButtonPrimaryWithHighlight>
                </Link>
              </MouseoverTooltip>
            </Flex>
            <Flex sx={{ gap: '16px' }} flexDirection={upToSmall ? 'column' : 'row'}>
              <Stat>
                <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                  <Trans>TVL</Trans>
                </Text>
                &nbsp;
                <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                  ~
                  {formatDisplayNumber(data?.dmmFactories[0].totalLiquidityUSD, {
                    style: 'currency',
                    fractionDigits: 2,
                    significantDigits: 12,
                  })}
                </Text>
              </Stat>
              <Stat>
                <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                  <Trans>Fees</Trans>
                </Text>
                &nbsp;
                <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                  ~$unknown
                  {/* //todo namgold */}
                </Text>
              </Stat>
              <Stat>
                <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                  <Trans>Volume</Trans>
                </Text>
                &nbsp;
                <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                  ~
                  {formatDisplayNumber(data?.dmmFactories[0].last24hPoolVolume, {
                    style: 'currency',
                    fractionDigits: 2,
                    significantDigits: 12,
                  })}
                </Text>
              </Stat>
            </Flex>
          </Flex>
        </StatsWrapper>
        {responsiveFilterGroup}
        <Flex>
          <PoolList
            pools={currentData}
            loading={isLoading}
            page={page}
            sortBy={sortBy}
            sortType={sortType}
            timeframe={timeframe}
            view={view}
          />
        </Flex>
      </PoolsPageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default KNPools
