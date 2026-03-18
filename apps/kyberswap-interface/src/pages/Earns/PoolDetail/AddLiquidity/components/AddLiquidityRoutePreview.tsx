import { AddLiquidityAction, Pool, Token, ZapAction, ZapRouteDetail } from '@kyber/schema'
import { formatUnits } from '@kyber/utils'
import { Fragment, useMemo } from 'react'
import { Box, Text } from 'rebass'
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
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
`

type RouteTokenItem = {
  token: Token
  amount?: number
}

interface AddLiquidityRoutePreviewProps {
  inputTokens?: Token[]
  inputAmounts?: string
  pool?: Pool | null
  zapRoute?: ZapRouteDetail | null
}

const parseInputAmount = (amount?: string) => {
  const parsedAmount = Number(amount || 0)
  return Number.isFinite(parsedAmount) ? parsedAmount : undefined
}

const parseRouteAmount = (amount: string | undefined, decimals: number) => {
  const parsedAmount = Number(formatUnits(BigInt(amount || '0').toString(), decimals))
  return Number.isFinite(parsedAmount) ? parsedAmount : undefined
}

const PreviewAssetItems = ({ items }: { items: RouteTokenItem[] }) => {
  const theme = useTheme()

  if (!items.length) {
    return (
      <Box height={17}>
        <PositionSkeleton width={160} height={16} />
      </Box>
    )
  }

  return (
    <HStack width="100%" minWidth={0} align="center" justify="center" gap={8} wrap="wrap">
      {items.slice(0, 2).map((item, index) => (
        <Fragment key={`${item.token.address}-${index}`}>
          {index > 0 ? (
            <Text color={theme.subText} fontSize={14}>
              |
            </Text>
          ) : null}
          <HStack minWidth={0} align="center" gap={4}>
            <TokenLogo src={item.token.logo} size={16} />
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
            </Text>
          </HStack>
        </Fragment>
      ))}
      {items.length > 2 ? (
        <HStack align="center" borderRadius={999} background={theme.tabActive} p="4px 8px">
          <Text color={theme.subText} fontSize={12}>
            +{items.length - 2} more
          </Text>
        </HStack>
      ) : null}
    </HStack>
  )
}

const PreviewAssetCard = ({ items, usdAmount }: { items: RouteTokenItem[]; usdAmount?: string }) => {
  const theme = useTheme()

  return (
    <AssetCard>
      <HStack align="center" p="8px 16px">
        <PreviewAssetItems items={items} />
      </HStack>
      <Stack justify="center" background={theme.background} p="8px 16px">
        <Text color={theme.subText} fontSize={14} textAlign="center">
          {usdAmount === undefined
            ? '...'
            : `~${formatDisplayNumber(Number(usdAmount), { style: 'currency', significantDigits: 6 })}`}
        </Text>
      </Stack>
    </AssetCard>
  )
}

const AddLiquidityRoutePreview = ({ inputTokens, inputAmounts, pool, zapRoute }: AddLiquidityRoutePreviewProps) => {
  const theme = useTheme()
  const amountList = useMemo(() => inputAmounts?.split(',') ?? [], [inputAmounts])

  const inputItems = useMemo(() => {
    return (inputTokens ?? []).map((token, index) => ({
      token,
      amount: parseInputAmount(amountList[index]),
    }))
  }, [amountList, inputTokens])

  const outputItems = useMemo(() => {
    if (!pool) return []
    const addLiquidityAction = zapRoute?.zapDetails.actions.find(
      (item): item is AddLiquidityAction => item.type === ZapAction.ADD_LIQUIDITY,
    )

    return [
      {
        token: pool.token0,
        amount: parseRouteAmount(addLiquidityAction?.addLiquidity.token0.amount, pool.token0.decimals),
      },
      {
        token: pool.token1,
        amount: parseRouteAmount(addLiquidityAction?.addLiquidity.token1.amount, pool.token1.decimals),
      },
    ]
  }, [zapRoute, pool])

  return (
    <FlowRow>
      <PreviewAssetCard items={inputItems} usdAmount={zapRoute?.zapDetails.initialAmountUsd} />

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

      <PreviewAssetCard items={outputItems} usdAmount={zapRoute?.positionDetails.addedAmountUsd} />
    </FlowRow>
  )
}

export default AddLiquidityRoutePreview
