import { Pair } from '@kyberswap/ks-sdk-classic'
import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { VERSION } from 'services/aggregatorStats'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import ClassicElasticTab from 'components/ClassicElasticTab'
import { AutoColumn } from 'components/Column'
import Withdraw from 'components/Icons/Withdraw'
import FullPositionCard from 'components/PositionCard'
import { AutoRow } from 'components/Row'
import Search from 'components/Search'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { APP_PATHS } from 'constants/index'
import { usePairsByAddress } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import ElasticLegacy from 'pages/ElasticLegacy'
import ProAmmPool from 'pages/ProAmmPool'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { useLiquidityPositionTokenPairs, useToV2LiquidityTokens } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { cn } from 'utils/cn'

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  active: boolean
}

export const Tab = ({ active, className, children, ...rest }: TabProps) => (
  <div
    className={cn(
      'cursor-pointer py-1 font-medium hover:text-primary max-sm:text-sm',
      active ? 'text-primary' : 'text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

interface PageWrapperProps extends React.ComponentProps<typeof AutoColumn> {
  className?: string
}

export const PageWrapper = ({ className, ...rest }: PageWrapperProps) => (
  <AutoColumn
    className={cn(
      'w-full max-w-[1224px] px-0 pb-[100px] pt-8 max-lg:max-w-[832px] max-lg:px-3 max-lg:pt-6 max-sm:max-w-[392px]',
      className,
    )}
    {...rest}
  />
)

export const InstructionText = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full items-center justify-between border-y border-border py-4 text-xs leading-normal text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const TitleRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-between gap-3 max-sm:w-full max-sm:flex-col max-sm:gap-4', className)}
    {...rest}
  >
    {children}
  </div>
)

export const PositionCardGrid = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid max-w-[1224px] gap-6 [grid-template-columns:minmax(392px,auto)_minmax(392px,auto)_minmax(392px,auto)] max-lg:max-w-[832px] max-lg:grid-cols-2 max-sm:max-w-[392px] max-sm:grid-cols-1',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const FilterRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-between gap-3 max-lg:w-full max-lg:justify-end',
      'max-sm:flex-col-reverse max-sm:items-start max-sm:gap-0',
      'max-sm:[&>div:nth-child(1)]:mt-5 max-sm:[&>div]:mt-3',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

interface PreloadCardProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
}

export const PreloadCard = ({ width, height, className, style, ...rest }: PreloadCardProps) => (
  <div
    className={cn(
      'relative inline-block overflow-hidden rounded-lg bg-background',
      "after:absolute after:inset-0 after:-translate-x-full after:animate-[ks-shimmer-x_2s_infinite] after:content-['']",
      'after:[background-image:linear-gradient(90deg,rgba(255,255,255,0)_0,rgba(255,255,255,0.2)_20%,rgba(255,255,255,0.5)_60%,rgba(255,255,255,0))]',
      className,
    )}
    style={{ width: width ?? '100%', height: height ?? '436px', ...style }}
    {...rest}
  />
)

export default function PoolCombination() {
  const { tab = VERSION.ELASTIC } = useParsedQueryString<{
    tab: string
  }>()
  useSyncNetworkParamWithStore()
  return (
    <PageWrapper className="pb-6">
      <ClassicElasticTab />
      {tab === VERSION.ELASTIC ? (
        <ProAmmPool />
      ) : tab === VERSION.ELASTIC_LEGACY ? (
        <ElasticLegacy tab="my_positions" />
      ) : (
        <MyPoolClassic />
      )}
    </PageWrapper>
  )
}

function MyPoolClassic() {
  const { account, networkInfo } = useActiveWeb3React()

  const under768 = useMedia('(max-width:768px)')
  const liquidityPositionTokenPairs = useLiquidityPositionTokenPairs()

  const [searchParams, setSearchParams] = useSearchParams()
  const searchValue = searchParams.get('search') || ''
  const debouncedSearchText = useDebounce(searchValue.trim().toLowerCase(), 300)

  const onSearch = (search: string) => {
    searchParams.set('search', search)
    setSearchParams(searchParams)
  }

  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(liquidityPositionTokenPairs)

  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens),
    [tokenPairsWithLiquidityTokens],
  )

  const tokens = useMemo(() => liquidityTokens.flat(), [liquidityTokens])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(tokens)

  const liquidityTokensWithBalances = useMemo(
    () =>
      liquidityTokens.reduce<{ liquidityToken: Token; tokens: [Token, Token] }[]>((acc, lpTokens, index) => {
        lpTokens
          .filter((lp: Token) => v2PairsBalances[lp.address]?.greaterThan('0'))
          .forEach((lp: Token) => {
            acc.push({ liquidityToken: lp, tokens: tokenPairsWithLiquidityTokens[index].tokens })
          })
        return acc
      }, []),
    [tokenPairsWithLiquidityTokens, liquidityTokens, v2PairsBalances],
  )

  const v2Pairs = usePairsByAddress(
    liquidityTokensWithBalances.map(({ liquidityToken, tokens }) => ({
      address: liquidityToken.address,
      currencies: tokens,
    })),
  )

  const v2IsLoading =
    fetchingV2PairBalances ||
    v2Pairs?.length < liquidityTokensWithBalances.length ||
    v2Pairs?.some(V2Pair => !V2Pair[1])

  const allV2PairsWithLiquidity = useMemo(
    () => v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair)),
    [v2Pairs],
  )

  // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = useMemo(
    () =>
      allV2PairsWithLiquidity.filter(v2Pair => {
        return debouncedSearchText
          ? v2Pair.token0.symbol?.toLowerCase().includes(debouncedSearchText) ||
              v2Pair.token1.symbol?.toLowerCase().includes(debouncedSearchText) ||
              v2Pair.address.toLowerCase() === debouncedSearchText
          : true
      }),
    [allV2PairsWithLiquidity, debouncedSearchText],
  )

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  const [showStaked, setShowStaked] = useState(false)

  const loading = v2IsLoading

  const { trackingHandler } = useTracking()

  const upToSmall = useMedia('(max-width: 768px)')

  return (
    <PageWrapper className="mt-6 p-0">
      <AutoColumn className="justify-center gap-6">
        <AutoColumn className="w-full gap-6">
          <AutoRow>
            <InstructionText>
              <Trans>Here you can view all your liquidity and staked balances in the Classic Pools.</Trans>
            </InstructionText>
          </AutoRow>
          <TitleRow>
            <div className="flex w-full flex-1 items-center justify-between">
              <div className="flex items-center gap-6">
                <Tab
                  active={!showStaked}
                  onClick={() => {
                    if (showStaked) {
                      trackingHandler(TRACKING_EVENT_TYPE.MYPOOLS_POOLS_VIEWED)
                    }
                    setShowStaked(false)
                  }}
                  role="button"
                >
                  <Trans>My Pools</Trans>
                </Tab>
                <Tab
                  active={showStaked}
                  onClick={() => {
                    if (!showStaked) {
                      trackingHandler(TRACKING_EVENT_TYPE.MYPOOLS_STAKED_VIEWED)
                    }
                    setShowStaked(true)
                  }}
                  role="button"
                >
                  <Trans>My Staked Pools</Trans>
                </Tab>
              </div>

              {upToSmall && (
                <div className="flex gap-3">
                  <Tutorial type={TutorialType.CLASSIC_MY_POOLS} />
                </div>
              )}
            </div>

            <div
              className="flex flex-row items-center justify-end gap-3"
              style={{ width: under768 ? '100%' : undefined }}
            >
              <Search
                style={{ width: 'unset', flex: under768 ? 1 : undefined }}
                minWidth={under768 ? '224px' : '254px'}
                searchValue={searchValue}
                onSearch={onSearch}
                placeholder={t`Search by token name or pool address`}
              />

              <ButtonPrimary
                as={StyledInternalLink}
                to={APP_PATHS.FIND_POOL}
                className="h-9 w-max px-3 py-2.5 text-sm !text-textReverse no-underline"
              >
                <Withdraw />
                <span className="ml-1">
                  <Trans>Import Pool</Trans>
                </span>
              </ButtonPrimary>

              {!upToSmall && <Tutorial type={TutorialType.CLASSIC_MY_POOLS} />}
            </div>
          </TitleRow>

          {!account ? (
            <Card className="p-10">
              <p className="m-0 text-center text-base text-text3">
                <Trans>Connect to a wallet to view your liquidity.</Trans>
              </p>
            </Card>
          ) : !showStaked ? (
            loading && !v2PairsWithoutStakedAmount.length ? (
              <PositionCardGrid>
                <PreloadCard></PreloadCard>
                <PreloadCard></PreloadCard>
                <PreloadCard></PreloadCard>
              </PositionCardGrid>
            ) : v2PairsWithoutStakedAmount?.length > 0 ? (
              <>
                <PositionCardGrid>
                  {v2PairsWithoutStakedAmount.map(v2Pair => {
                    return (
                      <FullPositionCard
                        key={v2Pair.liquidityToken.address}
                        pair={v2Pair}
                        myLiquidity={transformedUserLiquidityPositions[v2Pair.address.toLowerCase()]}
                        tab="ALL"
                      />
                    )
                  })}
                </PositionCardGrid>
                <span className="mt-4 text-center text-base text-subText">
                  {t`Don't see a pool you joined?`}{' '}
                  <StyledInternalLink id="import-pool-link" to={APP_PATHS.FIND_POOL}>
                    <Trans>Import it.</Trans>
                  </StyledInternalLink>
                </span>
              </>
            ) : (
              <div className="mt-[60px] flex flex-col items-center">
                <Info size={48} className="text-subText" />
                <span className="mt-4 text-center text-base leading-normal text-subText">
                  <Trans>
                    No liquidity found. Check out our{' '}
                    <StyledInternalLink to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=classic`}>
                      Pools.
                    </StyledInternalLink>
                  </Trans>
                  <br />
                  {t`Don't see a pool you joined?`}{' '}
                  <StyledInternalLink id="import-pool-link" to={APP_PATHS.FIND_POOL}>
                    <Trans>Import it.</Trans>
                  </StyledInternalLink>
                </span>
              </div>
            )
          ) : (
            <div className="mt-[60px] flex flex-col items-center">
              <Info size={48} className="text-subText" />
              <span className="mt-4 text-center text-base leading-normal text-subText">
                <Trans>
                  No staked liquidity found. Check out our{' '}
                  <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}`}>Farms.</StyledInternalLink>
                </Trans>
              </span>
            </div>
          )}
        </AutoColumn>
      </AutoColumn>
    </PageWrapper>
  )
}
