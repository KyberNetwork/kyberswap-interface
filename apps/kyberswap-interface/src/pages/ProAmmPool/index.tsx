import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import Search from 'components/Search'
import SubscribeNotificationButton from 'components/SubscribeButton'
import Toggle from 'components/Toggle'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { APP_PATHS } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { FilterRow, InstructionText, PageWrapper, PositionCardGrid, Tab } from 'pages/MyPool'
import { StyledInternalLink, TYPE } from 'theme'
import { PositionDetails } from 'types/position'

import ContentLoader from './ContentLoader'
import PositionGrid from './PositionGrid'

const Highlight = styled.span`
  color: ${({ theme }) => theme.text};
`

const TabRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 1rem;
    width: 100%;
    flex-direction: column;
  `}
`

const TabWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 8px;
  `}
`

interface AddressSymbolMapInterface {
  [key: string]: string
}

const renderNotificationButton = (iconOnly: boolean) => {
  return (
    <SubscribeNotificationButton
      iconOnly={iconOnly}
      subscribeTooltip={
        <div>
          <Trans>
            Subscribe to receive emails on your Elastic liquidity positions across all chains. Whenever a position goes
            <Highlight>out-of-range</Highlight> or comes back <Highlight>in-range</Highlight>, you will receive an
            email.
          </Trans>
        </div>
      }
      trackingEvent={MIXPANEL_TYPE.MYPOOLS_CLICK_SUBSCRIBE_BTN}
    />
  )
}

export default function ProAmmPool() {
  const { account, networkInfo } = useActiveWeb3React()
  const tokenAddressSymbolMap = useRef<AddressSymbolMapInterface>({})
  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const [openPositions, closedPositions] = useMemo(
    () =>
      positions?.reduce<[PositionDetails[], PositionDetails[]]>(
        (acc, p) => {
          acc[p.liquidity?.eq(0) ? 1 : 0].push(p)
          return acc
        },
        [[], []],
      ) ?? [[], []],
    [positions],
  )

  const theme = useTheme()

  const {
    search: searchValueInQs = '',
    tab = VERSION.ELASTIC,
    nftId,
  } = useParsedQueryString<{
    search: string
    tab: string
    nftId: string
  }>()

  const navigate = useNavigate()
  const location = useLocation()
  const onSearch = (search: string) => {
    navigate(location.pathname + '?search=' + search + '&tab=' + tab, { replace: true })
  }

  const debouncedSearchText = useDebounce(searchValueInQs.trim().toLowerCase(), 300)

  const [showClosed, setShowClosed] = useState(false)

  const filter = useCallback(
    (pos: PositionDetails): boolean => {
      return (
        debouncedSearchText.trim().length === 0 ||
        (!!tokenAddressSymbolMap.current[pos.token0.toLowerCase()] &&
          tokenAddressSymbolMap.current[pos.token0.toLowerCase()].includes(debouncedSearchText)) ||
        (!!tokenAddressSymbolMap.current[pos.token1.toLowerCase()] &&
          tokenAddressSymbolMap.current[pos.token1.toLowerCase()].includes(debouncedSearchText)) ||
        pos.poolId.toLowerCase() === debouncedSearchText ||
        pos.tokenId.toString() === debouncedSearchText
      )
    },
    [debouncedSearchText],
  )

  const filteredFarmPositions = useMemo(() => {
    return [].filter(filter)
  }, [filter])

  const sortFn = useCallback(
    (a: PositionDetails, b: PositionDetails) => +a.tokenId.toString() - +b.tokenId.toString(),
    [],
  )

  const filteredPositions = useMemo(() => {
    const opens = [...openPositions].sort(sortFn)
    const closeds = [...closedPositions].sort(sortFn)

    return (!showClosed ? opens : [...opens, ...closeds])
      .filter(position => {
        if (nftId) return position.tokenId.toString() === nftId
        return (
          debouncedSearchText.trim().length === 0 ||
          (!!tokenAddressSymbolMap.current[position.token0.toLowerCase()] &&
            tokenAddressSymbolMap.current[position.token0.toLowerCase()].includes(debouncedSearchText)) ||
          (!!tokenAddressSymbolMap.current[position.token1.toLowerCase()] &&
            tokenAddressSymbolMap.current[position.token1.toLowerCase()].includes(debouncedSearchText)) ||
          position.poolId.toLowerCase() === debouncedSearchText ||
          position.tokenId.toString() === debouncedSearchText
        )
      })
      .filter((pos, index, array) => array.findIndex(pos2 => pos2.tokenId.eq(pos.tokenId)) === index)
  }, [showClosed, openPositions, closedPositions, debouncedSearchText, nftId, sortFn])

  const [showStaked, setShowStaked] = useState(false)
  const positionList = useMemo(() => (showStaked ? [] : filteredPositions), [showStaked, filteredPositions])

  const upToSmall = useMedia('(max-width: 768px)')

  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <InstructionText>
            <Trans>Here you can view all your liquidity and staked balances in the Elastic Pools.</Trans>
          </InstructionText>
          <TabRow>
            <Flex justifyContent="space-between" flex={1} alignItems="center" width="100%">
              <TabWrapper>
                <Tab
                  active={!showStaked}
                  role="button"
                  onClick={() => {
                    setShowStaked(false)
                  }}
                >
                  <Trans>My Positions</Trans>
                </Tab>

                <Tab
                  active={showStaked}
                  onClick={() => {
                    setShowStaked(true)
                  }}
                  role="button"
                >
                  {isMobile ? <Trans>Farming Positions</Trans> : <Trans>My Farming Positions</Trans>}
                </Tab>
              </TabWrapper>

              {upToSmall && (
                <Flex sx={{ gap: '8px' }}>
                  <Tutorial type={TutorialType.ELASTIC_MY_POOLS} />
                  {renderNotificationButton(true)}
                </Flex>
              )}
            </Flex>
            <FilterRow>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <Text fontSize="14px" color={theme.subText}>
                  <Trans>Show closed positions</Trans>
                </Text>
                <Toggle isActive={showClosed} toggle={() => setShowClosed(prev => !prev)} />
              </Flex>
              <Search
                minWidth="254px"
                searchValue={searchValueInQs}
                onSearch={onSearch}
                placeholder={t`Search by token or pool address`}
              />
              {!upToSmall && (
                <>
                  <Tutorial type={TutorialType.ELASTIC_MY_POOLS} />
                  {renderNotificationButton(false)}
                </>
              )}
            </FilterRow>
          </TabRow>

          {!account ? (
            <Card padding="40px">
              <TYPE.body color={theme.text3} textAlign="center">
                <Trans>Connect to a wallet to view your liquidity.</Trans>
              </TYPE.body>
            </Card>
          ) : positionsLoading && !positions ? (
            <PositionCardGrid>
              <ContentLoader />
              <ContentLoader />
              <ContentLoader />
            </PositionCardGrid>
          ) : filteredPositions.length > 0 || filteredFarmPositions.length > 0 ? (
            <>
              <PositionGrid positions={positionList} refe={tokenAddressSymbolMap} />
            </>
          ) : (
            <Flex flexDirection="column" alignItems="center" marginTop="60px">
              <Info size={48} color={theme.subText} />
              <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                <Trans>
                  No liquidity found. Check out our{' '}
                  <StyledInternalLink to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=elastic`}>
                    Pools.
                  </StyledInternalLink>
                </Trans>
              </Text>
            </Flex>
          )}
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
