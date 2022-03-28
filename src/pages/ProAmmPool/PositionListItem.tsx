import React, { useState } from 'react'
import { Position } from '@vutien/dmm-v3-sdk'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useMemo } from 'react'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { PositionDetails } from 'types/position'
import { CurrencyAmount, Price, Token } from '@vutien/sdk-core'
import styled from 'styled-components/macro'
import { Link } from 'react-router-dom'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
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
import Loader from 'components/Loader'
import Divider from 'components/Divider'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.text};
  margin: 8px 0;
  padding: 16px;
  text-decoration: none;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg1};

  &:last-of-type {
    margin: 8px 0 0 0;
  }
  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.bg2};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 4px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  background-color: ${({ theme }) => theme.bg2};
    border-radius: 12px;
    padding: 8px 0;
`};
`

const DoubleArrow = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.text3};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 4px;
    padding: 20px;
  `};
`

const RangeText = styled.span`
  /* background-color: ${({ theme }) => theme.bg2}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `};
`

//---------
const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 28px 20px 16px;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 32px 16px 16px;
  `}
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
  padding: 8px;
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
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)
  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  // check if price is within range
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  const positionSummaryLink =
    '/proamm/increase/' +
    (currencyBase?.isNative ? currencyBase?.symbol : currencyBase?.address) +
    '/' +
    (currencyQuote?.isNative ? currencyQuote?.symbol : currencyQuote?.address) +
    '/' +
    positionDetails.fee +
    '/' +
    positionDetails.tokenId

  const removed = liquidity?.eq(0)

  const [activeTab, setActiveTab] = useState(0)
  return (
    <StyledPositionCard>
      {position && priceLower && priceUpper ? (
        <>
          <ProAmmPoolInfo position={position} />
          <TabContainer style={{ marginTop: '1rem' }}>
            <Tab isActive={activeTab === 0} padding="0" onClick={() => setActiveTab(0)}>
              <TabText isActive={activeTab === 0}>
                <Trans>Your Liquidity</Trans>
              </TabText>
            </Tab>
            <Tab isActive={activeTab === 1} padding="0" onClick={() => setActiveTab(1)}>
              <TabText isActive={activeTab === 1}>
                <Trans>PriceRange</Trans>
              </TabText>
            </Tab>
          </TabContainer>
          {activeTab === 0 && (
            <>
              <ProAmmPooledTokens
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
          <Flex marginTop="20px" sx={{ gap: '1rem' }}>
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
          <div style={{ marginTop: '20px' }} />
          <Flex flexDirection={'column'} marginTop="auto">
            <Divider sx={{ marginBottom: '20px' }} />
            <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
              <ExternalLink style={{ width: '100%', textAlign: 'center' }} href={``}>
                <Trans>Analytics ↗</Trans>
              </ExternalLink>
            </ButtonEmpty>
          </Flex>
        </>
      ) : (
        <Loader />
      )}
    </StyledPositionCard>
  )
}
