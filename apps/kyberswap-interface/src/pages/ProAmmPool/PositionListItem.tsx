import { Currency, CurrencyAmount, Price, Token } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { stringify } from 'querystring'
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { LightCard } from 'components/Card'
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
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { ExternalLink, StyledInternalLink } from 'theme'
import { PositionDetails } from 'types/position'
import { currencyId } from 'utils/currencyId'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import ContentLoader from './ContentLoader'

const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

export const TabContainer = styled.div`
  display: flex;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.tabBackground};
  padding: 2px;
`

export const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.tabActive : theme.tabBackground)};
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  padding: 4px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.2s;

  &:hover {
    text-decoration: none;
  }
`

const StakedInfo = styled.div`
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  margin-top: 16px;
`

const StakedRow = styled.div`
  line-height: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 20px;

  > * {
    /* to make sure all immediate buttons take equal width */
    flex: 1 1 50%;
  }
`

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

  const { mixpanelHandler } = useMixpanel()

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
    <StyledPositionCard>
      <>
        <ProAmmPoolInfo
          position={position}
          tokenId={positionDetails.tokenId.toString()}
          isFarmActive={hasActiveFarm}
          isFarmV2Active={hasActiveFarmV2}
        />
        <TabContainer style={{ marginTop: '1rem' }}>
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
              <StakedInfo>
                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>My Staked Balance</Trans>
                  </Text>
                  <Text>{formatDollarAmount(stakedUsd)}</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>My Staked {position.amount0.currency.symbol}</Trans>
                  </Text>
                  <Text>{0}</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>My Staked {position.amount1.currency.symbol}</Trans>
                  </Text>
                  <Text>0</Text>
                </StakedRow>

                <StakedRow>
                  <Text color={theme.subText}>
                    <Trans>My Farm APR</Trans>
                  </Text>
                  <Text color={theme.apr}>{farmAPR || farmV2APR ? (farmAPR || farmV2APR).toFixed(2) + '%' : '--'}</Text>
                </StakedRow>
              </StakedInfo>
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
        <div style={{ marginTop: '20px' }} />
        <Flex flexDirection={'column'} marginTop="auto">
          {stakedLayout ? (
            <ButtonPrimary
              style={{ marginBottom: '20px', textDecoration: 'none', color: theme.textReverse, fontSize: '14px' }}
              padding="8px"
              as={StyledInternalLink}
              to={`${APP_PATHS.FARMS}/${networkInfo.route}?${stringify({
                tab: 'elastic',
                type: positionDetails.endTime ? (positionDetails.endTime > now ? 'active' : 'ended') : 'active',
                search: positionDetails.poolId,
              })}`}
            >
              <Trans>Go to Farm</Trans>
            </ButtonPrimary>
          ) : (
            <ButtonGroup>
              {reasonToDisableRemoveLiquidity ? (
                <MouseoverTooltip text={reasonToDisableRemoveLiquidity} placement="top">
                  <Flex
                    // this flex looks like redundant
                    // but without this, the cursor will be default
                    // as we put pointerEvents=none on the button
                    sx={{
                      cursor: 'not-allowed',
                      width: '100%',
                    }}
                  >
                    <ButtonOutlined
                      style={{
                        padding: '8px',
                        width: '100%',
                        pointerEvents: 'none',
                      }}
                      disabled
                    >
                      <Text width="max-content" fontSize="14px">
                        <Trans>Remove Liquidity</Trans>
                      </Text>
                    </ButtonOutlined>
                  </Flex>
                </MouseoverTooltip>
              ) : (
                <ButtonOutlined
                  padding="8px"
                  as={Link}
                  to={`/${networkInfo.route}${APP_PATHS.ELASTIC_REMOVE_POOL}/${positionDetails.tokenId}`}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED, {
                      token_1: token0?.symbol || '',
                      token_2: token1?.symbol || '',
                      fee_tier: (pool?.fee as number) / 10000,
                    })
                  }}
                >
                  <Text width="max-content" fontSize="14px">
                    <Trans>Remove Liquidity</Trans>
                  </Text>
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
                  mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED, {
                    token_1: token0?.symbol || '',
                    token_2: token1?.symbol || '',
                    fee_tier: (pool?.fee as number) / 10000,
                  })
                }}
              >
                <Text width="max-content" fontSize="14px">
                  <Trans>Increase Liquidity</Trans>
                </Text>
              </ButtonPrimary>
            </ButtonGroup>
          )}
          <Divider sx={{ marginBottom: '20px' }} />
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
        </Flex>
      </>
    </StyledPositionCard>
  )
}

export default React.memo(PositionListItem)
