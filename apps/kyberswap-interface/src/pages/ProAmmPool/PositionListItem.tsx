import { Currency, CurrencyAmount, Price, Token } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import React, { ComponentProps, HTMLAttributes, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, PROMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { ExternalLink, StyledInternalLink } from 'theme'
import { PositionDetails } from 'types/position'
import { cn } from 'utils/cn'
import { currencyId } from 'utils/currencyId'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import ContentLoader from './ContentLoader'

export const TabContainer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex rounded-full bg-tabBackground p-0.5', className)} {...rest} />
)

type TabProps = ComponentProps<typeof ButtonEmpty> & { isActive?: boolean; isLeft?: boolean }
export const Tab = ({ isActive, isLeft: _isLeft, className, ...rest }: TabProps) => (
  <ButtonEmpty
    className={cn(
      'flex flex-1 items-center justify-center rounded-[20px] p-1 text-xs font-medium transition-all duration-200 hover:no-underline',
      isActive ? 'bg-tabActive text-text' : 'bg-tabBackground text-subText',
      className,
    )}
    {...rest}
  />
)

enum TAB {
  MY_LIQUIDITY = 'my-liquidity',
  PRICE_RANGE = 'price-range',
}

interface PositionListItemProps {
  positionDetails: PositionDetails
  rawFeeRewards: [string, string]
  liquidityTime?: number
  farmingTime?: number
  createdAt?: number
  hasUserDepositedInFarm?: boolean
  stakedLayout?: boolean
  refe?: React.MutableRefObject<any>
}

function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }
  const token0 = position.amount0.currency
  const token1 = position.amount1.currency
  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

function PositionListItem({
  stakedLayout,
  hasUserDepositedInFarm,
  positionDetails,
  refe,
  rawFeeRewards,
  liquidityTime,
  farmingTime,
  createdAt,
}: PositionListItemProps) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionDetails

  // let pid = ''
  const rewardTokens: Currency[] = []

  const hasActiveFarm = false
  const hasActiveFarmV2 = false

  const [farmReward, _setFarmReward] = useState<BigNumber[] | null>(null)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  if (refe && token0 && !refe.current[token0Address.toLocaleLowerCase()] && token0.symbol) {
    refe.current[token0Address.toLocaleLowerCase()] = token0.symbol.toLowerCase()
  }
  if (refe && token1 && !refe.current[token1Address.toLocaleLowerCase()] && token1.symbol) {
    refe.current[token1Address.toLocaleLowerCase()] = token1.symbol.toLowerCase()
  }
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const prices = useTokenPrices([
    currency0?.wrapped.address || '',
    currency1?.wrapped.address || '',
    ...rewardTokens.map(item => item.wrapped.address),
  ])

  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const feeValue0 = currency0 && CurrencyAmount.fromRawAmount(currency0, rawFeeRewards[0])
  const feeValue1 = currency1 && CurrencyAmount.fromRawAmount(currency1, rawFeeRewards[1])

  const usd =
    parseFloat(position?.amount0.toExact() || '0') * prices[token0?.wrapped.address || ''] +
    parseFloat(position?.amount1.toExact() || '0') * prices[token1?.wrapped.address || '']

  const stakedUsd = 0

  const currentFeeValue =
    Number(feeValue0?.toExact() || '0') * prices[token0?.wrapped.address || ''] +
    Number(feeValue1?.toExact() || '0') * prices[token1?.wrapped.address || '']

  const estimatedOneYearFee = liquidityTime && (currentFeeValue * 365 * 24 * 60 * 60) / liquidityTime
  const positionAPR = liquidityTime && usd ? (((estimatedOneYearFee || 0) * 100) / usd).toFixed(2) : '--'

  const farmRewardValue = rewardTokens.reduce((usdValue, currency, index) => {
    const temp = farmReward?.[index]
    return (
      usdValue +
      +CurrencyAmount.fromRawAmount(currency, temp?.gt('0') ? temp?.toString() : '0').toExact() *
        prices[currency.wrapped.address]
    )
  }, 0)

  const estimatedOneYearFarmReward = farmingTime && (farmRewardValue * 365 * 24 * 60 * 60) / farmingTime
  const farmAPR = farmReward !== null && farmingTime && usd ? ((estimatedOneYearFarmReward || 0) * 100) / usd : 0

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const farmV2APR = 0

  // prices
  const { priceLower, priceUpper } = getPriceOrderingFromPositionForUI(position)

  const removed = liquidity?.eq(0)
  const theme = useTheme()

  const { trackingHandler } = useTracking()

  const [activeTab, setActiveTab] = useState(TAB.MY_LIQUIDITY)
  const now = Date.now() / 1000

  const reasonToDisableRemoveLiquidity = (() => {
    if (removed) {
      return t`You have zero liquidity to remove`
    }
    return ''
  })()

  if (!position || !priceLower || !priceUpper) return <ContentLoader />

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[20px] bg-background p-5 max-md:p-4">
      <ProAmmPoolInfo
        position={position}
        tokenId={positionDetails.tokenId.toString()}
        isFarmActive={hasActiveFarm}
        isFarmV2Active={hasActiveFarmV2}
      />
      <TabContainer className="mt-4">
        <Tab isActive={activeTab === TAB.MY_LIQUIDITY} padding="0" onClick={() => setActiveTab(TAB.MY_LIQUIDITY)}>
          <Trans>My Liquidity</Trans>
        </Tab>
        <Tab isActive={activeTab === TAB.PRICE_RANGE} padding="0" onClick={() => setActiveTab(TAB.PRICE_RANGE)}>
          <Trans>Price Range</Trans>
        </Tab>
      </TabContainer>
      {activeTab === TAB.MY_LIQUIDITY && (
        <>
          {!stakedLayout ? (
            <ProAmmPooledTokens
              positionAPR={positionAPR}
              createdAt={createdAt}
              farmAPR={farmAPR || farmV2APR}
              valueUSD={usd}
              stakedUsd={stakedUsd}
              liquidityValue0={CurrencyAmount.fromRawAmount(
                unwrappedToken(position.pool.token0),
                position.amount0.quotient,
              )}
              liquidityValue1={CurrencyAmount.fromRawAmount(
                unwrappedToken(position.pool.token1),
                position.amount1.quotient,
              )}
              layout={1}
            />
          ) : (
            <div className="mt-4 rounded border border-border p-3">
              <div className="flex justify-between text-xs leading-6">
                <span className="text-subText">
                  <Trans>My Staked Balance</Trans>
                </span>
                <span>{formatDollarAmount(stakedUsd)}</span>
              </div>

              <div className="flex justify-between text-xs leading-6">
                <span className="text-subText">
                  <Trans>My Staked {position.amount0.currency.symbol}</Trans>
                </span>
                <span>{0}</span>
              </div>

              <div className="flex justify-between text-xs leading-6">
                <span className="text-subText">
                  <Trans>My Staked {position.amount1.currency.symbol}</Trans>
                </span>
                <span>0</span>
              </div>

              <div className="flex justify-between text-xs leading-6">
                <span className="text-subText">
                  <Trans>My Farm APR</Trans>
                </span>
                <span style={{ color: theme.apr }}>
                  {farmAPR || farmV2APR ? (farmAPR || farmV2APR).toFixed(2) + '%' : '--'}
                </span>
              </div>
            </div>
          )}
          {!stakedLayout && (
            <ProAmmFee
              totalFeeRewardUSD={currentFeeValue}
              feeValue0={feeValue0}
              feeValue1={feeValue1}
              position={position}
              tokenId={positionDetails.tokenId}
              layout={1}
            />
          )}
        </>
      )}
      {activeTab === TAB.PRICE_RANGE && <ProAmmPriceRange position={position} ticksAtLimit={tickAtLimit} />}
      <div className="mt-5" />
      <div className="mt-auto flex flex-col">
        {stakedLayout ? (
          <ButtonPrimary
            style={{ marginBottom: '20px', textDecoration: 'none', color: theme.textReverse, fontSize: '14px' }}
            padding="8px"
            as={StyledInternalLink}
            to={`${APP_PATHS.FARMS}/${networkInfo.route}?${new URLSearchParams({
              tab: 'elastic',
              type: positionDetails.endTime ? (positionDetails.endTime > now ? 'active' : 'ended') : 'active',
              search: positionDetails.poolId,
            }).toString()}`}
          >
            <Trans>Go to Farm</Trans>
          </ButtonPrimary>
        ) : (
          <div className="mb-5 flex gap-4 [&>*]:flex-1 [&>*]:basis-1/2">
            {reasonToDisableRemoveLiquidity ? (
              <MouseoverTooltip text={reasonToDisableRemoveLiquidity} placement="top">
                <div className="flex w-full cursor-not-allowed">
                  <ButtonOutlined
                    style={{
                      padding: '8px',
                      width: '100%',
                      pointerEvents: 'none',
                    }}
                    disabled
                  >
                    <span className="w-max text-sm">
                      <Trans>Remove Liquidity</Trans>
                    </span>
                  </ButtonOutlined>
                </div>
              </MouseoverTooltip>
            ) : (
              <ButtonOutlined
                padding="8px"
                as={Link}
                to={`/${networkInfo.route}${APP_PATHS.ELASTIC_REMOVE_POOL}/${positionDetails.tokenId}`}
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED, {
                    token_1: token0?.symbol || '',
                    token_2: token1?.symbol || '',
                    fee_tier: (pool?.fee as number) / 10000,
                  })
                }}
              >
                <span className="w-max text-sm">
                  <Trans>Remove Liquidity</Trans>
                </span>
              </ButtonOutlined>
            )}

            <ButtonPrimary
              id="increase-liquidity-button"
              padding="8px"
              style={{
                borderRadius: '18px',
                fontSize: '14px',
              }}
              as={Link}
              to={`/${networkInfo.route}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${currencyId(
                currency0,
                chainId,
              )}/${currencyId(currency1, chainId)}/${feeAmount}/${positionDetails.tokenId}`}
              onClick={() => {
                trackingHandler(TRACKING_EVENT_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED, {
                  token_1: token0?.symbol || '',
                  token_2: token1?.symbol || '',
                  fee_tier: (pool?.fee as number) / 10000,
                })
              }}
            >
              <span className="w-max text-sm">
                <Trans>Increase Liquidity</Trans>
              </span>
            </ButtonPrimary>
          </div>
        )}
        <Divider className="mb-5" />
        <RowBetween>
          <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
            <ExternalLink
              style={{ width: '100%', textAlign: 'center' }}
              href={`${PROMM_ANALYTICS_URL[chainId]}/pool/${positionDetails.poolId.toLowerCase()}`}
            >
              <Trans>Pool Analytics ↗</Trans>
            </ExternalLink>
          </ButtonEmpty>

          {(hasUserDepositedInFarm || hasActiveFarm || hasActiveFarmV2) && (
            <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
              <StyledInternalLink
                style={{ width: '100%', textAlign: 'center' }}
                to={`${APP_PATHS.FARMS}/${networkInfo.route}`}
              >
                <Trans>Go to Farms ↗</Trans>
              </StyledInternalLink>
            </ButtonEmpty>
          )}
        </RowBetween>
      </div>
    </div>
  )
}

export default React.memo(PositionListItem)
