import {
  AddLiquidityAction,
  AggregatorSwapAction,
  Pool,
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
import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
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
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
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
  z-index: 1;
  left: -4px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.border};
  opacity: 0.8;
  transform: translateY(-50%);

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
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.buttonGray};
`

type RouteTokenItem = {
  address: string
  token: Token
  amount?: number
}

interface AddLiquidityRoutePreviewProps {
  chainId?: number
  inputTokens?: Token[]
  pool?: Pool | null
  zapRoute?: ZapRouteDetail | null
}

const formatUsdAmount = (value?: string) => {
  if (value !== null && value !== undefined && Number(value ?? 0) > 0) {
    return `~ ${formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })}`
  }

  return `~ ${formatDisplayNumber(0, { style: 'currency', significantDigits: 6 })}`
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

const getPreviewAddresses = ({
  inputTokens,
  pool,
  zapRoute,
}: {
  inputTokens?: Token[]
  pool?: Pool | null
  zapRoute?: ZapRouteDetail | null
}) => {
  if (!zapRoute)
    return {
      inputItems:
        inputTokens?.map(token => ({
          address: token.address.toLowerCase(),
          amount: '0',
        })) || [],
      outputItems: pool
        ? [
            {
              address: pool.token0.address.toLowerCase(),
              amount: '0',
            },
            {
              address: pool.token1.address.toLowerCase(),
              amount: '0',
            },
          ]
        : [],
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

export default function AddLiquidityRoutePreview({
  chainId,
  inputTokens,
  pool,
  zapRoute,
}: AddLiquidityRoutePreviewProps) {
  const theme = useTheme()
  const { inputItems: previewInputs, outputItems: previewOutputs } = useMemo(
    () => getPreviewAddresses({ inputTokens, pool, zapRoute }),
    [inputTokens, pool, zapRoute],
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

  const fallbackTokens = useMemo(
    () => [...(inputTokens || []), ...(pool ? [pool.token0, pool.token1] : [])],
    [inputTokens, pool],
  )

  const routeTokenMap = useMemo(
    () =>
      new Map(
        [...fallbackTokens, ...routeTokens].map(token => [
          token.address.toLowerCase(),
          token as Token & {
            logoURI?: string
          },
        ]),
      ),
    [fallbackTokens, routeTokens],
  )

  const inputItems = useMemo(
    () => previewInputs.map(item => toRouteTokenItem(item, routeTokenMap)),
    [previewInputs, routeTokenMap],
  )

  const outputItems = useMemo(
    () => previewOutputs.map(item => toRouteTokenItem(item, routeTokenMap)),
    [previewOutputs, routeTokenMap],
  )

  return (
    <FlowRow>
      <AssetCard>
        <HStack align="center" p="8px 16px">
          {inputItems.length ? (
            <HStack width="100%" minWidth={0} align="center" justify="center" gap={8} wrap="wrap">
              {inputItems.slice(0, 2).map((item, index) => (
                <Fragment key={`${item.token.address}-${index}`}>
                  {index > 0 ? (
                    <Text color={theme.subText} fontSize={14}>
                      |
                    </Text>
                  ) : null}
                  <HStack minWidth={0} align="center" gap={4}>
                    <TokenLogo src={getTokenLogo(item.token)} size={16} />
                    <Text color={theme.text} fontSize={14} fontWeight={500}>
                      {item.amount !== undefined
                        ? `${formatDisplayNumber(item.amount, {
                            significantDigits: 6,
                          })} `
                        : ''}
                      {item.token.symbol}
                    </Text>
                  </HStack>
                </Fragment>
              ))}
              {inputItems.length > 2 ? (
                <HStack align="center" borderRadius={999} background={theme.tabActive} p="4px 8px">
                  <Text color={theme.subText} fontSize={12}>
                    +{inputItems.length - 2} more
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          ) : (
            <PositionSkeleton width={120} height={17} />
          )}
        </HStack>
        <Stack
          justify="center"
          background={theme.background}
          p="8px 16px"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <Text color={theme.subText} fontSize={14} textAlign="center">
            {formatUsdAmount(zapRoute?.zapDetails.initialAmountUsd)}
          </Text>
        </Stack>
      </AssetCard>

      <StepTrack>
        <TrackLine />
        <TrackStartDot />
        <StepPill>
          <KyberLogo width={18} height={18} />
          <Text color={theme.subText} fontSize={14} fontWeight={500}>
            Kyber Zap
          </Text>
        </StepPill>
      </StepTrack>

      <AssetCard>
        <HStack align="center" p="8px 16px">
          {outputItems.length ? (
            <HStack width="100%" minWidth={0} align="center" justify="center" gap={8} wrap="wrap">
              {outputItems.slice(0, 2).map((item, index) => (
                <Fragment key={`${item.token.address}-${index}`}>
                  {index > 0 ? (
                    <Text color={theme.subText} fontSize={14}>
                      |
                    </Text>
                  ) : null}
                  <HStack minWidth={0} align="center" gap={4}>
                    <TokenLogo src={getTokenLogo(item.token)} size={16} />
                    <Text color={theme.text} fontSize={14} fontWeight={500}>
                      {item.amount !== undefined
                        ? `${formatDisplayNumber(item.amount, {
                            significantDigits: 6,
                          })} `
                        : ''}
                      {item.token.symbol}
                    </Text>
                  </HStack>
                </Fragment>
              ))}
              {outputItems.length > 2 ? (
                <HStack align="center" borderRadius={999} background={theme.tabActive} p="4px 8px">
                  <Text color={theme.subText} fontSize={12}>
                    +{outputItems.length - 2} more
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          ) : (
            <PositionSkeleton width={120} height={17} />
          )}
        </HStack>
        <Stack
          justify="center"
          background={theme.background}
          p="8px 16px"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <Text color={theme.subText} fontSize={14} textAlign="center">
            {formatUsdAmount(zapRoute?.positionDetails.addedAmountUsd)}
          </Text>
        </Stack>
      </AssetCard>
    </FlowRow>
  )
}
