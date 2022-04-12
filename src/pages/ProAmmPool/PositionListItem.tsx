import React, { useState } from 'react'
import { Position } from '@vutien/dmm-v3-sdk'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useMemo } from 'react'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { PositionDetails } from 'types/position'
import { CurrencyAmount, Price, Token, ChainId } from '@vutien/sdk-core'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'theme'
import { Trans } from '@lingui/macro'
import { currencyId } from 'utils/currencyId'
import { LightCard } from 'components/Card'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import { Flex, Text } from 'rebass'
import { useWeb3React } from '@web3-react/core'
import Divider from 'components/Divider'
import ContentLoader from './ContentLoader'
import { PROMM_ANALYTICS_URL } from 'constants/index'

const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 28px 20px 16px;
  display: flex;
  flex-direction: column;
`

const TabContainer = styled.div`
  display: flex;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonBlack)};
  padding: 6px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme, isActive }) => (isActive ? theme.textReverse : theme.subText)};
`
interface PositionListItemProps {
  positionDetails: PositionDetails
  refe?: React.MutableRefObject<any>
}

export function getPriceOrderingFromPositionForUI(
  position?: Position,
): {
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
export default function PositionListItem({ positionDetails, refe }: PositionListItemProps) {
  const { chainId } = useWeb3React()
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionDetails
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

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const {
    priceLower,
    priceUpper,
    // quote,
    // base,
  } = getPriceOrderingFromPositionForUI(position)
  // const currencyQuote = quote && unwrappedToken(quote)
  // const currencyBase = base && unwrappedToken(base)

  // check if price is within range
  // const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  // const positionSummaryLink =
  //   '/proamm/increase/' +
  //   (currencyBase?.isNative ? currencyBase?.symbol : currencyBase?.address) +
  //   '/' +
  //   (currencyQuote?.isNative ? currencyQuote?.symbol : currencyQuote?.address) +
  //   '/' +
  //   positionDetails.fee +
  //   '/' +
  //   positionDetails.tokenId

  // const removed = liquidity?.eq(0)

  const [activeTab, setActiveTab] = useState(0)
  return position && priceLower && priceUpper ? (
    <StyledPositionCard>
      <>
        <ProAmmPoolInfo position={position} />
        <TabContainer style={{ marginTop: '1rem' }}>
          <Tab isActive={activeTab === 0} padding="0" onClick={() => setActiveTab(0)}>
            <TabText isActive={activeTab === 0} style={{ fontSize: '12px' }}>
              <Trans>Your Liquidity</Trans>
            </TabText>
          </Tab>
          <Tab isActive={activeTab === 1} padding="0" onClick={() => setActiveTab(1)}>
            <TabText isActive={activeTab === 1} style={{ fontSize: '12px' }}>
              <Trans>Price Range</Trans>
            </TabText>
          </Tab>
        </TabContainer>
        {activeTab === 0 && (
          <>
            <ProAmmPooledTokens
              valueUSD={positionDetails.valueUSD}
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
            <ProAmmFee position={position} tokenId={positionDetails.tokenId} layout={1} />
          </>
        )}
        {activeTab === 1 && <ProAmmPriceRange position={position} ticksAtLimit={tickAtLimit} layout={1} />}
        <div style={{ marginTop: '20px' }} />
        <Flex flexDirection={'column'} marginTop="auto">
          <Flex marginBottom="20px" sx={{ gap: '1rem' }}>
            <ButtonPrimary
              padding="9px"
              style={{ fontSize: '14px', borderRadius: '18px' }}
              as={Link}
              to={`/proamm/increase/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${feeAmount}/${
                positionDetails.tokenId
              }`}
            >
              <Text width="max-content">
                <Trans>Increase Liquidity</Trans>
              </Text>
            </ButtonPrimary>
            <ButtonOutlined
              style={{
                padding: '9px',
                borderRadius: '18px',
                fontSize: '14px',
              }}
              as={Link}
              to={`/proamm/remove/${positionDetails.tokenId}`}
            >
              <Text width="max-content">
                <Trans>Remove Liquidity</Trans>
              </Text>
            </ButtonOutlined>
          </Flex>
          <Divider sx={{ marginBottom: '20px' }} />
          <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
            <ExternalLink
              style={{ width: '100%', textAlign: 'center' }}
              href={`${PROMM_ANALYTICS_URL[chainId as ChainId]}/pools/${positionDetails.address}`}
            >
              <Trans>Pool Analytics ↗</Trans>
            </ExternalLink>
          </ButtonEmpty>
        </Flex>
      </>
    </StyledPositionCard>
  ) : (
    <ContentLoader />
  )
}
