import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  Token,
  ZapAction,
  ZapRouteDetail,
} from '@kyber/schema'
import { formatUnits } from '@kyber/utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { Fragment, useMemo } from 'react'
import { Text } from 'rebass'
import { useAddLiquidityTokensQuery } from 'services/zapInService'
import styled from 'styled-components'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { formatDisplayNumber } from 'utils/numbers'

const FlowRow = styled(HStack)`
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: stretch;
  `}
`

const AssetCard = styled(Stack)`
  position: relative;
  z-index: 1;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: #171717;
`

const AmountText = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const ValueText = styled(Text)`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  text-align: center;
`

const AssetMain = styled(HStack)`
  align-items: center;
  padding: 8px 16px;
`

const AssetFooter = styled(Stack)`
  justify-content: center;
  padding: 8px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`

const AssetRow = styled(HStack)`
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  width: 100%;
`

const AssetToken = styled(HStack)`
  align-items: center;
  gap: 4px;
  min-width: 0;
`

const Divider = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
`

const MoreBadge = styled(HStack)`
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const StepTrack = styled(Stack)`
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 100%;
    min-height: 80px;
  `}
`

const TrackLine = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  top: 50%;
  height: 1px;
  background: ${({ theme }) => theme.border};
  opacity: 0.6;

  &::after {
    content: '';
    position: absolute;
    right: 0px;
    top: 50%;
    transform: translateY(-50%);
    border-left: 6px solid ${({ theme }) => theme.border};
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 50%;
    right: auto;
    top: -8px;
    bottom: -8px;
    width: 1px;
    height: auto;
    transform: translateX(-50%);

    &::after {
      left: 50%;
      right: auto;
      top: auto;
      bottom: 8px;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 6px solid ${({ theme }) => theme.border};
      border-bottom: 0;
    }
  `}
`

const TrackStartDot = styled.div`
  position: absolute;
  left: -4px;
  top: 50%;
  z-index: 1;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.border};
  opacity: 0.85;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 50%;
    top: -4px;
    transform: translateX(-50%);
  `}
`

const StepPill = styled(HStack)`
  position: relative;
  z-index: 1;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(21, 21, 24, 0.92);
`

const StepText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

type RouteTokenItem = {
  address: string
  token: Token
  amount?: number
}

export interface AddLiquidityRoutePreviewProps {
  chainId?: number
  zapRoute?: ZapRouteDetail | null
}

const formatUsd = (value?: number | null, fallbackZero = false) => {
  if (value !== null && value !== undefined && value > 0) {
    return `~ ${formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })}`
  }

  if (fallbackZero) {
    return `~ ${formatDisplayNumber(0, { style: 'currency', significantDigits: 6 })}`
  }

  return '~ --'
}

const getTokenLogo = (token?: Token | null) => {
  if (!token) return ''

  const tokenWithLogoUri = token as Token & { logoURI?: string }
  return tokenWithLogoUri.logo || tokenWithLogoUri.logoURI || ''
}

const createFallbackToken = (address: string): Token => ({
  address,
  symbol: `${address.slice(0, 4)}...${address.slice(-2)}`,
  name: address,
  decimals: 18,
  logo: '',
  isStable: false,
})

const addAmountToMap = (map: Map<string, string>, address: string, amount?: string) => {
  if (!amount) return

  const normalizedAddress = address.toLowerCase()
  const currentAmount = map.get(normalizedAddress) || '0'
  map.set(normalizedAddress, (BigInt(currentAmount) + BigInt(amount)).toString())
}

const getPreviewAddresses = (zapRoute?: ZapRouteDetail | null) => {
  if (!zapRoute)
    return {
      inputItems: [] as Array<{ address: string; amount?: string }>,
      outputItems: [] as Array<{ address: string; amount?: string }>,
    }

  const addLiquidityAction = zapRoute.zapDetails.actions.find(item => item.type === ZapAction.ADD_LIQUIDITY) as
    | AddLiquidityAction
    | undefined
  const swapActions = zapRoute.zapDetails.actions.filter(
    item => item.type === ZapAction.AGGREGATOR_SWAP || item.type === ZapAction.POOL_SWAP,
  ) as Array<AggregatorSwapAction | PoolSwapAction>
  const swapInputMap = new Map<string, string>()
  const swapOutputAddresses = new Set<string>()

  swapActions.forEach(action => {
    const swaps = action.type === ZapAction.AGGREGATOR_SWAP ? action.aggregatorSwap.swaps : action.poolSwap.swaps

    swaps.forEach(swap => {
      addAmountToMap(swapInputMap, swap.tokenIn.address, swap.tokenIn.amount)
      swapOutputAddresses.add(swap.tokenOut.address.toLowerCase())
    })
  })

  const inputItems = Array.from(swapInputMap.entries())
    .filter(([address]) => !swapOutputAddresses.has(address))
    .map(([address, amount]) => ({
      address,
      amount,
    }))

  const outputItems = addLiquidityAction
    ? [
        {
          address: addLiquidityAction.addLiquidity.token0.address.toLowerCase(),
          amount: addLiquidityAction.addLiquidity.token0.amount,
        },
        {
          address: addLiquidityAction.addLiquidity.token1.address.toLowerCase(),
          amount: addLiquidityAction.addLiquidity.token1.amount,
        },
      ]
    : []

  outputItems.forEach(item => {
    if (!swapOutputAddresses.has(item.address) && !inputItems.find(input => input.address === item.address)) {
      inputItems.push(item)
    }
  })

  return {
    inputItems,
    outputItems,
  }
}

const renderAssetItems = (items: RouteTokenItem[], emptyText?: string) => {
  if (!items.length) return <AmountText>{emptyText}</AmountText>

  const visibleItems = items.slice(0, 2)
  const remainingCount = items.length - visibleItems.length

  return (
    <AssetRow>
      {visibleItems.map((item, index) => (
        <Fragment key={`${item.token.address}-${index}`}>
          {index > 0 ? <Divider>|</Divider> : null}
          <AssetToken>
            <TokenLogo src={getTokenLogo(item.token)} size={16} />
            <AmountText>
              {item.amount && item.amount > 0 ? `${formatDisplayNumber(item.amount, { significantDigits: 6 })} ` : ''}
              {item.token.symbol}
            </AmountText>
          </AssetToken>
        </Fragment>
      ))}
      {remainingCount > 0 ? <MoreBadge>+{remainingCount} more</MoreBadge> : null}
    </AssetRow>
  )
}

const toRouteTokenItem = (
  item: { address: string; amount?: string },
  tokenMap: Map<string, Token & { logoURI?: string }>,
): RouteTokenItem => {
  const token = tokenMap.get(item.address.toLowerCase()) || createFallbackToken(item.address)
  const amount =
    item.amount && token.decimals >= 0 ? Number(formatUnits(BigInt(item.amount).toString(), token.decimals)) : undefined

  return {
    address: item.address,
    token,
    amount: Number.isFinite(amount) ? amount : undefined,
  }
}

export default function AddLiquidityRoutePreview({ chainId, zapRoute }: AddLiquidityRoutePreviewProps) {
  const { inputItems: previewInputs, outputItems: previewOutputs } = useMemo(
    () => getPreviewAddresses(zapRoute),
    [zapRoute],
  )
  const tokenAddresses = useMemo(
    () =>
      Array.from(
        new Set([...previewInputs, ...previewOutputs].map(item => item.address.toLowerCase()).filter(Boolean)),
      ),
    [previewInputs, previewOutputs],
  )
  const { data: routeTokens = [] } = useAddLiquidityTokensQuery(
    chainId && tokenAddresses.length
      ? {
          chainId,
          addresses: tokenAddresses,
        }
      : skipToken,
  )
  const routeTokenMap = useMemo(
    () =>
      new Map(
        routeTokens.map(token => [
          token.address.toLowerCase(),
          token as Token & {
            logoURI?: string
          },
        ]),
      ),
    [routeTokens],
  )
  const inputItems = useMemo(
    () => previewInputs.map(item => toRouteTokenItem(item, routeTokenMap)),
    [previewInputs, routeTokenMap],
  )
  const outputItems = useMemo(
    () => previewOutputs.map(item => toRouteTokenItem(item, routeTokenMap)),
    [previewOutputs, routeTokenMap],
  )
  const showZeroInputUsd = Boolean(zapRoute)
  const showZeroOutputUsd = Boolean(zapRoute)

  return (
    <FlowRow>
      <AssetCard>
        <AssetMain>{renderAssetItems(inputItems, '--')}</AssetMain>
        <AssetFooter>
          <ValueText>
            {formatUsd(zapRoute ? Number(zapRoute.zapDetails.initialAmountUsd || 0) : null, showZeroInputUsd)}
          </ValueText>
        </AssetFooter>
      </AssetCard>

      <StepTrack>
        <TrackLine />
        <TrackStartDot />
        <StepPill>
          <KyberLogo width={18} height={18} />
          <StepText>Kyber Zap</StepText>
        </StepPill>
      </StepTrack>

      <AssetCard>
        <AssetMain>{renderAssetItems(outputItems, '--')}</AssetMain>
        <AssetFooter>
          <ValueText>
            {formatUsd(zapRoute ? Number(zapRoute.positionDetails.addedAmountUsd || 0) : null, showZeroOutputUsd)}
          </ValueText>
        </AssetFooter>
      </AssetCard>
    </FlowRow>
  )
}
