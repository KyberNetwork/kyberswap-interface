import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { Search, Share2 } from 'react-feather'
import { useSelector } from 'react-redux'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import ClassicElasticTab from 'components/ClassicElasticTab'
import Column from 'components/Column'
import Loader from 'components/Loader'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import RewardTokenPrices from 'components/RewardTokenPrices'
import Row, { RowFit } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Toggle from 'components/Toggle'
import Tutorial, { TutorialType } from 'components/Tutorial'
import Vesting from 'components/Vesting'
import YieldPools from 'components/YieldPools'
import FarmGuide from 'components/YieldPools/FarmGuide'
import FarmSort from 'components/YieldPools/FarmPoolSort'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import ShareFarmAddressModal from 'components/YieldPools/ShareFarmAddressModal'
import {
  HeadingContainer,
  HeadingRight,
  PageWrapper,
  PoolTitleContainer,
  SearchContainer,
  SearchInput,
  StakedOnlyToggleText,
  StakedOnlyToggleWrapper,
  TabContainer,
  TopBar,
} from 'components/YieldPools/styleds'
import { FARM_TAB } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import Notice from 'pages/ElasticLegacy/Notice'
import { CurrencyWrapper, Tab } from 'pages/Pools/styleds'
import { AppState } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useBlockNumber, useOpenModal } from 'state/application/hooks'
import { useFarmsData } from 'state/farms/classic/hooks'
import ClassicFarmUpdater from 'state/farms/classic/updater'
import { FarmUpdater, useElasticFarms } from 'state/farms/elastic/hooks'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import ElasticFarmV2Updater from 'state/farms/elasticv2/updater'
import { isInEnum } from 'utils/string'

import { ElasticFarmCombination } from './ElasticFarmCombination'

const Farm = () => {
  const { isEVM, chainId } = useActiveWeb3React()
  const { loading, data: farmsByFairLaunch } = useFarmsData()
  const theme = useTheme()

  const [searchParams, setSearchParams] = useSearchParams()
  const type: string = searchParams.get('type') || FARM_TAB.ACTIVE
  const tab: string = searchParams.get('tab') || VERSION.ELASTIC
  const search: string = searchParams.get('search') || ''
  const stakedOnly: boolean = searchParams.get('stakedOnly') === 'true'
  const farmType = isInEnum(tab, VERSION) ? tab : VERSION.ELASTIC

  const above1000 = useMedia('(min-width: 1000px)')

  const openShareModal = useOpenModal(ApplicationModal.SHARE)

  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const navigateTab = (nextTab: FARM_TAB) => {
    searchParams.set('type', nextTab)
    searchParams.set('stakedOnly', nextTab === FARM_TAB.ENDED ? 'true' : 'false')
    setSearchParams(searchParams)
  }

  const handleSearch = (search: string) => {
    searchParams.set('search', search)
    setSearchParams(searchParams, { replace: true })
  }

  const renderTabContent = () => {
    switch (type) {
      case FARM_TAB.ACTIVE:
        return farmType === VERSION.ELASTIC ? <ElasticFarmCombination /> : <YieldPools loading={loading} active />
      case FARM_TAB.ENDED:
        return farmType === VERSION.ELASTIC ? (
          <ElasticFarmCombination />
        ) : (
          <YieldPools loading={loading} active={false} />
        )
      case FARM_TAB.VESTING:
        return farmType === VERSION.ELASTIC ? null : <Vesting loading={vestingLoading} />
      case FARM_TAB.MY_FARMS:
        return farmType === VERSION.ELASTIC ? (
          <ElasticFarmCombination />
        ) : (
          <YieldPools loading={loading} active={false} />
        )

      default:
        return <YieldPools loading={loading} active />
    }
  }
  const { mixpanelHandler } = useMixpanel()
  useSyncNetworkParamWithStore()

  const below992 = useMedia('(max-width: 992px)')
  const below1500 = useMedia('(max-width: 1500px)')

  const blockNumber = useBlockNumber()

  const { farms: elasticFarms } = useElasticFarms()
  const { farms: elasticFarmsV2 } = useElasticFarmsV2()

  const rewardTokens = useMemo(() => {
    const tokenMap: { [address: string]: Currency } = {}
    const currentTimestamp = Math.floor(Date.now() / 1000)
    Object.values(farmsByFairLaunch)
      .flat()
      .filter(
        item =>
          (item.endTime && item.endTime > currentTimestamp) ||
          (blockNumber && item.endBlock && item.endBlock > blockNumber),
      )
      .forEach(current => {
        current.rewardTokens.forEach(token => {
          if (token && token.chainId === chainId && !tokenMap[token.wrapped.address])
            tokenMap[token.wrapped.address] = token
        })
      })

    elasticFarms?.forEach(farm => {
      farm.pools.forEach(pool => {
        if (pool.endTime > Date.now() / 1000)
          pool.totalRewards.forEach(reward => {
            tokenMap[reward.currency.wrapped.address] = reward.currency
          })
      })
    })

    elasticFarmsV2?.forEach(farm => {
      if (farm.endTime > Date.now() / 1000 && !farm.isSettled) {
        farm.totalRewards.forEach(rw => {
          tokenMap[rw.currency.wrapped.address] = rw.currency
        })
      }
    })

    return Object.values(tokenMap)
  }, [farmsByFairLaunch, blockNumber, elasticFarms, chainId, elasticFarmsV2])

  const rewardPrice = !!rewardTokens.length && (
    <Flex
      flex={1}
      width={below1500 ? 'calc(100vw - 706px)' : '796px'}
      sx={{ gap: '4px' }}
      alignItems="center"
      justifyContent="flex-end"
    >
      <RewardTokenPrices
        rewardTokens={rewardTokens}
        style={{ display: 'flex', width: '100%', overflow: 'hidden', flex: 1 }}
      />
    </Flex>
  )

  const token0Id = searchParams.get('token0') || undefined
  const token1Id = searchParams.get('token1') || undefined

  const token0 = useCurrency(token0Id)
  const token1 = useCurrency(token1Id)

  if (!isEVM) return <Navigate to="/" />

  const selectTokenFilter = (
    <CurrencyWrapper>
      <PoolsCurrencyInputPanel
        onCurrencySelect={currency => {
          searchParams.set('token0', currency.wrapped.address)
          setSearchParams(searchParams)
        }}
        onClearCurrency={() => {
          searchParams.set('token0', '')
          setSearchParams(searchParams)
        }}
        currency={token0}
        id="input-tokena"
        showCommonBases
      />
      <Text marginX="6px">-</Text>
      <PoolsCurrencyInputPanel
        onCurrencySelect={currency => {
          searchParams.set('token1', currency.wrapped.address)
          setSearchParams(searchParams)
        }}
        onClearCurrency={() => {
          searchParams.set('token1', '')
          setSearchParams(searchParams)
        }}
        currency={token1}
        id="input-tokenb"
        showCommonBases
      />
    </CurrencyWrapper>
  )

  return (
    <>
      <ElasticFarmV2Updater />
      <ClassicFarmUpdater isInterval />
      <FarmUpdater />
      <ShareFarmAddressModal />
      <PageWrapper gap="24px">
        <div>
          <TopBar>
            <ClassicElasticTab />

            {!below992 && (
              <>
                {rewardPrice}

                <Flex sx={{ gap: '24px' }} width="max-content">
                  <Tutorial
                    type={farmType === VERSION.ELASTIC ? TutorialType.ELASTIC_FARMS : TutorialType.CLASSIC_FARMS}
                    customIcon={
                      <Flex
                        sx={{ gap: '4px', cursor: 'pointer' }}
                        fontSize="14px"
                        alignItems="center"
                        fontWeight="500"
                        color={theme.subText}
                        role="button"
                      >
                        <TutorialIcon />
                        <Trans>Video Tutorial</Trans>
                      </Flex>
                    }
                  />

                  <Flex
                    sx={{ gap: '4px', cursor: 'pointer' }}
                    fontSize="14px"
                    alignItems="center"
                    fontWeight="500"
                    color={theme.subText}
                    onClick={() => openShareModal()}
                  >
                    <Share2 size={20} />
                    Share
                  </Flex>
                </Flex>
              </>
            )}
          </TopBar>

          {farmType === VERSION.ELASTIC && (
            <div style={{ marginTop: '1rem' }}>
              <Notice />
            </div>
          )}

          <FarmGuide farmType={farmType} />
        </div>
        {below992 && (
          <Flex sx={{ gap: '1rem' }}>
            {rewardPrice}
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <Flex sx={{ gap: '16px' }} alignItems="center">
                <Tutorial
                  type={farmType === VERSION.ELASTIC ? TutorialType.ELASTIC_FARMS : TutorialType.CLASSIC_FARMS}
                  customIcon={<TutorialIcon color={theme.subText} style={{ width: '20px', height: '20px' }} />}
                />
                <Share2 color={theme.subText} size={20} onClick={() => openShareModal()} />
              </Flex>
            </Flex>
          </Flex>
        )}

        <div>
          <TabContainer>
            <Flex sx={{ gap: '8px' }}>
              <Tab
                onClick={() => {
                  if (type && type !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  navigateTab(FARM_TAB.ACTIVE)
                }}
                active={!type || type === 'active'}
              >
                <PoolTitleContainer>
                  <Trans>Active</Trans>
                </PoolTitleContainer>
              </Tab>
              <Tab
                onClick={() => {
                  if (type !== 'ended') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ENDING_VIEWED)
                  }
                  navigateTab(FARM_TAB.ENDED)
                }}
                active={type === FARM_TAB.ENDED}
              >
                <PoolTitleContainer>
                  <Trans>Ended</Trans>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  navigateTab(FARM_TAB.MY_FARMS)
                }}
                active={type === FARM_TAB.MY_FARMS}
              >
                <Row>
                  <Trans>My Farms</Trans>
                </Row>
              </Tab>

              {farmType === VERSION.CLASSIC && (
                <Tab
                  onClick={() => {
                    if (type !== 'vesting') {
                      mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                    }
                    navigateTab(FARM_TAB.VESTING)
                  }}
                  active={type === FARM_TAB.VESTING}
                >
                  <Row>
                    <Text>
                      <Trans>Vesting</Trans>
                    </Text>
                    {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
                  </Row>
                </Tab>
              )}
            </Flex>

            <HeadingContainer>
              <StakedOnlyToggleWrapper>
                <Row gap="12px">
                  {above1000 && (
                    <RowFit>
                      <ListGridViewGroup />
                    </RowFit>
                  )}

                  {type !== FARM_TAB.MY_FARMS && (
                    <>
                      <StakedOnlyToggleText>
                        <Trans>Staked Only</Trans>
                      </StakedOnlyToggleText>
                      <Toggle
                        isActive={stakedOnly}
                        toggle={() => {
                          searchParams.set('stakedOnly', stakedOnly ? 'false' : 'true')
                          setSearchParams(searchParams)
                        }}
                      />
                    </>
                  )}
                  <FarmSort />
                </Row>
              </StakedOnlyToggleWrapper>
              <HeadingRight>
                {selectTokenFilter}
                <SearchContainer>
                  <SearchInput
                    placeholder={t`Search by token name or pool address`}
                    maxLength={255}
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  <Search color={theme.subText} size={16} />
                </SearchContainer>
              </HeadingRight>
            </HeadingContainer>
          </TabContainer>
          <Column gap="20px">{renderTabContent()}</Column>
        </div>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default Farm
