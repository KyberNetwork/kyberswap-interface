import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetAllPoolsQuery } from 'services/knprotocol'
import styled from 'styled-components'

import statsBackground from 'assets/images/stats-bg.png'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import { ButtonError, ButtonGray, ButtonOutlined } from 'components/Button'
import Drawer from 'components/Modal/Drawer'
import Search from 'components/Search'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { MouseoverTooltip } from 'components/Tooltip'
import { PoolTitleContainer, TabGroup } from 'components/YieldPools/styleds'
import { SORT_DIRECTION } from 'constants/index'
import { EVM_MAINNET_NETWORKS, EVM_NETWORK, isEVM } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useGlobalData } from 'state/about/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import CreatePoolsButton from './CreatePoolsButton'
import PoolList from './PoolList'
import {
  ITEM_PER_PAGE,
  POOL_TIMEFRAME,
  POOL_TYPE,
  SORT_FIELD,
  poolProtocolText,
  poolSortText,
  poolTimeframeText,
  poolTypeText,
  poolViewIcon,
} from './const'
import { OptionsGroup, PoolsPageWrapper, SelectGroup, Tab } from './styleds'

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
  search?: string
  page: number
  protocol?: VERSION.ELASTIC | VERSION.CLASSIC
  type?: POOL_TYPE
  sortBy: SORT_FIELD
  sortType: SORT_DIRECTION
  timeframe: POOL_TIMEFRAME
  highlightCreateButton: boolean
  view: VIEW_MODE
} => {
  const chainIds: EVM_NETWORK[] = (searchParams.get('chains') || '').split(',').map(Number).filter(isEVM)
  const type: string = searchParams.get('type') || ''
  const page: number = parseInt(searchParams.get('page') || '')
  const protocol: string = searchParams.get('protocol') || ''
  const sortBy: string = searchParams.get('sortBy') || ''
  const sortType: string = (searchParams.get('sortType') || '').toLowerCase()
  const search: string | undefined = searchParams.get('search') || undefined
  const view: string = searchParams.get('view') || ''
  const highlightCreateButton: string = searchParams.get('highlightCreateButton') || ''
  const timeframe: string = searchParams.get('timeframe') || ''

  const validatedProtocol: VERSION.ELASTIC | VERSION.CLASSIC | undefined = (
    [VERSION.ELASTIC, VERSION.CLASSIC] as const
  ).includes(protocol)
    ? protocol
    : undefined
  const validatedType: POOL_TYPE | undefined = (
    [POOL_TYPE.STABLES, POOL_TYPE.LSDS, POOL_TYPE.FARMING_POOLS, POOL_TYPE.MY_POSITIONS] as const
  ).includes(type)
    ? type
    : undefined
  const validatedSortBy: SORT_FIELD | undefined =
    [SORT_FIELD.TVL, SORT_FIELD.APR, SORT_FIELD.VOLUME, SORT_FIELD.FEE, SORT_FIELD.MY_LIQUIDITY].find(
      field => field.toLowerCase() === sortBy.toLowerCase(),
    ) || SORT_FIELD.TVL
  const validatedSortType: SORT_DIRECTION | undefined = ([SORT_DIRECTION.ASC, SORT_DIRECTION.DESC] as const).includes(
    sortType,
  )
    ? sortType
    : SORT_DIRECTION.DESC
  const validatedTimeframe: POOL_TIMEFRAME = (
    [POOL_TIMEFRAME.D1, POOL_TIMEFRAME.D7, POOL_TIMEFRAME.D30] as const
  ).includes(timeframe)
    ? timeframe
    : (POOL_TIMEFRAME.D1 as const)
  const validatedViewmode: VIEW_MODE = ([VIEW_MODE.LIST, VIEW_MODE.GRID] as const).includes(view)
    ? view
    : (VIEW_MODE.GRID as const)

  return {
    chainIds: chainIds.length ? chainIds : networkList,
    search,
    page: isNaN(page) ? 1 : page,
    protocol: validatedProtocol,
    type: validatedType,
    sortBy: validatedSortBy,
    sortType: validatedSortType,
    timeframe: validatedTimeframe,
    highlightCreateButton: highlightCreateButton === 'true',
    view: validatedViewmode,
  }
}

const KNPools = () => {
  const { chainId, account } = useActiveWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()
  const { chainIds, search, page, protocol, type, sortBy, sortType, timeframe, highlightCreateButton, view } =
    validateParams(searchParams)

  const {
    data: rawData,
    isFetching,
    error,
  } = useGetAllPoolsQuery({
    chainIds: chainIds.length ? chainIds : isEVM(chainId) ? [chainId] : [],
    search,
    page,
    size: ITEM_PER_PAGE,
    protocol,
    type,
    sortBy,
    sortType,
    timeframe,
    account,
  })
  const data = error ? null : rawData

  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const statData = useGlobalData()

  const [searchState, setSearchState] = useState(search)
  const [openMenu, setOpenMenu] = useState<boolean | 'chain' | 'type' | 'protocol' | 'sort'>(false)

  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const setSearchParamsRef = useRef(setSearchParams)
  setSearchParamsRef.current = setSearchParams
  useEffect(() => {
    const sync = () => {
      if (searchState) searchParamsRef.current.set('search', searchState)
      else searchParamsRef.current.delete('search')
      setSearchParamsRef.current(searchParamsRef.current, { replace: true })
    }
    const timeoutToken = setTimeout(sync, 100)
    return () => {
      clearTimeout(timeoutToken)
    }
  }, [searchState])

  const setPage = useCallback((page: number) => {
    if (page && page > 1) searchParamsRef.current.set('page', String(page))
    else searchParamsRef.current.delete('page')
    setSearchParamsRef.current(searchParamsRef.current, { replace: true })
  }, [])

  const setType = useCallback(
    (type: POOL_TYPE | '') => () => {
      if (type) searchParamsRef.current.set('type', type)
      else searchParamsRef.current.delete('type')
      setSearchParamsRef.current(searchParamsRef.current, { replace: true })
    },
    [],
  )

  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
    } else {
      setPage(1)
    }
  }, [protocol, type, setPage])

  useEffect(() => {
    if (!account && type === POOL_TYPE.MY_POSITIONS) {
      setType('')()
    }
  }, [account, type, setType])

  const onSelectChains = useCallback(
    (chains: ChainId[]) => {
      if (chains?.length) searchParams.set('chains', chains.join(','))
      else searchParams.delete('chains')
      setSearchParams(searchParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const isValidNetwork = networkList.includes(chainId)
  const handleClickCurrentChain = useCallback(() => {
    if (!isValidNetwork) return

    searchParamsRef.current.set('chains', String(chainId))
    setSearchParamsRef.current(searchParamsRef.current, { replace: true })
  }, [chainId, isValidNetwork])
  const filterCount = [
    chainIds.length !== networkList.length,
    searchParams.get('type'),
    searchParams.get('protocol'),
    searchParams.get('sortBy'),
    searchParams.get('timeframe'),
  ].filter(Boolean).length

  if (!isEVM) return <Navigate to="/" />

  const desktopFilterGroup = upToSmall ? null : (
    <>
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
            <CreatePoolsButton highlightCreateButton={highlightCreateButton} />
          </Flex>
          <Flex sx={{ gap: '16px' }} flexDirection={upToSmall ? 'column' : 'row'}>
            <Stat>
              <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                <Trans>TVL</Trans>
              </Text>
              &nbsp;
              <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                ~
                {formatDisplayNumber(statData?.dmmFactories[0].totalLiquidityUSD, {
                  style: 'currency',
                  fractionDigits: 2,
                  significantDigits: 12,
                })}
              </Text>
            </Stat>
            {/* <Stat>
              <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                <Trans>Fees</Trans>
              </Text>
              &nbsp;
              <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                ~$unknown
                {/* //todo namgold
              </Text>
            </Stat> */}
            <Stat>
              <Text fontSize={14} fontWeight={400} lineHeight="20px" color={theme.subText}>
                <Trans>Volume (24H)</Trans>
              </Text>
              &nbsp;
              <Text fontSize={14} fontWeight={500} lineHeight="20px" color={theme.text}>
                ~
                {formatDisplayNumber(statData?.aggregatorData?.last24hPoolVolume, {
                  style: 'currency',
                  fractionDigits: 2,
                  significantDigits: 12,
                })}
              </Text>
            </Stat>
          </Flex>
        </Flex>
      </StatsWrapper>
      <Flex justifyContent="space-between" sx={{ gap: '24px' }} flexDirection={upToMedium ? 'column' : 'row'}>
        <TabGroup>
          {(['', POOL_TYPE.STABLES, POOL_TYPE.LSDS, POOL_TYPE.FARMING_POOLS, POOL_TYPE.MY_POSITIONS] as const).map(
            poolType => {
              const disabled = poolType === POOL_TYPE.MY_POSITIONS && !account
              const tab = (
                <Tab
                  onClick={disabled ? undefined : setType(poolType)}
                  active={poolType === (type || '')}
                  key={poolType}
                  disabled={disabled}
                >
                  <PoolTitleContainer>{poolTypeText[poolType]}</PoolTitleContainer>
                </Tab>
              )
              if (poolType === POOL_TYPE.LSDS)
                return (
                  <MouseoverTooltip
                    text={t`Liquid staking derivates (e.g. wstETH)`}
                    placement="top"
                    width="max-content"
                  >
                    {tab}
                  </MouseoverTooltip>
                )
              if (disabled)
                return (
                  <MouseoverTooltip text={t`Please connect wallet first.`} placement="top" width="max-content">
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
                active={poolProtocol === (protocol || '')}
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
              {([POOL_TIMEFRAME.D1, POOL_TIMEFRAME.D7, POOL_TIMEFRAME.D30] as const).map(poolTimeframe => (
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
          searchValue={searchState || ''}
          onSearch={search => {
            setSearchState(search)
          }}
          placeholder={t`Search by token name or pool address`}
        />
      </Flex>
    </>
  )

  const mobileFilterGroup = upToSmall && (
    <>
      <Flex flexDirection="row" justifyContent="space-between">
        <Flex>
          <Text fontSize={24} fontWeight={500} lineHeight="28px">
            <Trans>Pools</Trans>
          </Text>
        </Flex>
        <Flex sx={{ gap: '12px' }}>
          <Drawer
            title={t`Filter`}
            isOpen={!!openMenu}
            onDismiss={() => setOpenMenu(false)}
            trigger={
              <ButtonGray padding="8px 16px" onClick={() => setOpenMenu(true)}>
                <Flex sx={{ gap: '8px' }}>
                  <Text>
                    <Trans>Filter</Trans>
                  </Text>
                  {filterCount > 0 && (
                    <Text
                      fontSize={12}
                      fontWeight={500}
                      lineHeight="16px"
                      padding="2px 6px"
                      width={20}
                      height={20}
                      backgroundColor={theme['o-white-20']}
                      sx={{ borderRadius: '24px' }}
                    >
                      {filterCount}
                    </Text>
                  )}
                </Flex>
              </ButtonGray>
            }
          >
            <Flex sx={{ gap: '20px' }} flexDirection="column" marginTop="28px">
              <Flex flexDirection="column">
                <MultipleChainSelect
                  style={{ height: 36, width: '100%', flex: 'unset', backgroundColor: theme['greyscale-600'] }}
                  handleChangeChains={onSelectChains}
                  chainIds={networkList}
                  selectedChainIds={chainIds}
                />
              </Flex>
              <Flex flexDirection="column" sx={{ gap: '4px' }}>
                <SelectGroup onClick={() => setOpenMenu(openMenu !== 'type' ? 'type' : true)}>
                  <Text flexDirection="row" alignItems="center">
                    {type ? poolTypeText[type] : t`All Pools Categories`}
                  </Text>
                  <DropdownArrowIcon rotate={openMenu === 'type'} />
                </SelectGroup>
                {openMenu === 'type' && (
                  <OptionsGroup
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    style={{ display: 'flex' }}
                  >
                    {(
                      ['', POOL_TYPE.STABLES, POOL_TYPE.LSDS, POOL_TYPE.FARMING_POOLS, POOL_TYPE.MY_POSITIONS] as const
                    ).map(poolType => {
                      const disabled = poolType === POOL_TYPE.MY_POSITIONS && !account
                      return (
                        <Flex key={poolType} onClick={disabled ? undefined : setType(poolType)} disabled={disabled}>
                          <Text
                            color={poolType === (type || '') ? theme.primary : disabled ? theme.subText : ''}
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                          >
                            {poolTypeText[poolType]}
                          </Text>
                        </Flex>
                      )
                    })}
                  </OptionsGroup>
                )}
              </Flex>
              <Flex flexDirection="column" sx={{ gap: '4px' }}>
                <SelectGroup onClick={() => setOpenMenu(openMenu !== 'protocol' ? 'protocol' : true)}>
                  <Text flexDirection="row" alignItems="center">
                    {protocol ? poolProtocolText[protocol] : t`All Pool Types`}
                  </Text>
                  <DropdownArrowIcon rotate={openMenu === 'protocol'} />
                </SelectGroup>
                {openMenu === 'protocol' && (
                  <OptionsGroup
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    style={{ display: 'flex' }}
                  >
                    {(['', VERSION.CLASSIC, VERSION.ELASTIC] as const).map(poolProtocol => (
                      <Flex
                        key={poolProtocol}
                        onClick={() => {
                          if (poolProtocol) searchParams.set('protocol', poolProtocol)
                          else searchParams.delete('protocol')
                          setSearchParams(searchParams, { replace: true })
                        }}
                      >
                        <Text color={poolProtocol === (protocol || '') ? theme.primary : ''}>
                          {poolProtocolText[poolProtocol]}
                        </Text>
                      </Flex>
                    ))}
                  </OptionsGroup>
                )}
              </Flex>
              <Flex flexDirection="column" sx={{ gap: '4px' }}>
                <SelectGroup onClick={() => setOpenMenu(openMenu !== 'sort' ? 'sort' : true)}>
                  <Flex flexDirection="row" alignItems="center">
                    <Text>{poolSortText[sortBy]} </Text>
                    {sortType === SORT_DIRECTION.DESC ? (
                      <ArrowDown size="14" style={{ marginLeft: '2px' }} />
                    ) : (
                      <ArrowUp size="14" style={{ marginLeft: '2px' }} />
                    )}
                  </Flex>
                  <DropdownArrowIcon rotate={openMenu === 'sort'} />
                </SelectGroup>
                {openMenu === 'sort' && (
                  <OptionsGroup
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    style={{ display: 'flex' }}
                  >
                    {(
                      [
                        SORT_FIELD.TVL,
                        SORT_FIELD.APR,
                        SORT_FIELD.VOLUME,
                        SORT_FIELD.FEE,
                        SORT_FIELD.MY_LIQUIDITY,
                      ] as const
                    ).map(pSortBy =>
                      ([SORT_DIRECTION.ASC, SORT_DIRECTION.DESC] as const).map(pSortType => {
                        const sortArrow =
                          pSortType === SORT_DIRECTION.DESC ? (
                            <ArrowDown size="14" style={{ marginLeft: '2px' }} />
                          ) : (
                            <ArrowUp size="14" style={{ marginLeft: '2px' }} />
                          )

                        return (
                          <Flex
                            key={pSortBy + '_' + pSortType}
                            onClick={() => {
                              searchParams.set('sortType', pSortType)
                              searchParams.set('sortBy', pSortBy === SORT_FIELD.MY_LIQUIDITY && !account ? '' : pSortBy)

                              setSearchParams(searchParams, { replace: true })
                            }}
                          >
                            <Flex
                              flexDirection="row"
                              alignItems="center"
                              color={pSortBy === sortBy && pSortType === sortType ? theme.primary : ''}
                            >
                              <Text>{poolSortText[pSortBy]}</Text>
                              {sortArrow}
                            </Flex>
                          </Flex>
                        )
                      }),
                    )}
                  </OptionsGroup>
                )}
              </Flex>
              <TabGroup style={{ backgroundColor: theme['o-black-48'], width: '100%' }}>
                {([POOL_TIMEFRAME.D1, POOL_TIMEFRAME.D7, POOL_TIMEFRAME.D30] as const).map(poolTimeframe => (
                  <Tab
                    padding="8px 12px"
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
              <Flex>
                <ButtonError
                  width="200px"
                  onClick={() => {
                    ;['chains', 'protocol', 'type', 'timeframe', 'sortType', 'sortBy'].forEach(key =>
                      searchParams.delete(key),
                    )
                    setSearchParams(searchParams)
                    setSearchState('')
                  }}
                >
                  <Text>
                    <Trans>Reset</Trans>
                  </Text>
                </ButtonError>
              </Flex>
            </Flex>
          </Drawer>

          <CreatePoolsButton highlightCreateButton={highlightCreateButton} />
        </Flex>
      </Flex>

      <TabGroup style={{ width: '100%' }}>
        {(['', POOL_TYPE.MY_POSITIONS] as const).map(poolType => {
          const disabled = poolType === POOL_TYPE.MY_POSITIONS && !account
          const tab = (
            <Tab
              onClick={disabled ? undefined : setType(poolType)}
              active={poolType === (type || '')}
              key={poolType}
              disabled={disabled}
              style={{ width: '100%' }}
            >
              <PoolTitleContainer>{poolTypeText[poolType]}</PoolTitleContainer>
            </Tab>
          )
          if (disabled)
            return (
              <Flex width="100%" alignItems="center">
                <MouseoverTooltip
                  text={t`Please connect wallet first.`}
                  placement="top"
                  wrapperWidth="100%"
                  width="fit-content"
                >
                  {tab}
                </MouseoverTooltip>
              </Flex>
            )
          return tab
        })}
      </TabGroup>
      <Search
        style={{ width: 'unset', flex: 1, backgroundColor: 'unset', border: `1px solid ${theme.border}` }}
        searchValue={searchState || ''}
        onSearch={search => {
          setSearchState(search)
        }}
        placeholder={t`Search by token name or pool address`}
        minWidth="unset"
      />
    </>
  )

  return (
    <>
      <PoolsPageWrapper>
        {upToSmall ? mobileFilterGroup : desktopFilterGroup}
        <Flex>
          {error ? (
            <Flex
              backgroundColor={theme.background}
              justifyContent="center"
              alignItems="center"
              sx={{ borderRadius: '20px', width: '100%', height: '400px' }}
            >
              <Text color={theme.subText}>
                {search || protocol || type ? (
                  <Trans>No Pools found</Trans>
                ) : (
                  <Trans>Currently there are no Pools.</Trans>
                )}
              </Text>
            </Flex>
          ) : (
            <PoolList
              data={data}
              loading={isFetching}
              page={page}
              setPage={setPage}
              sortBy={sortBy}
              sortType={sortType}
              timeframe={timeframe}
              view={view}
            />
          )}
        </Flex>
      </PoolsPageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default KNPools
