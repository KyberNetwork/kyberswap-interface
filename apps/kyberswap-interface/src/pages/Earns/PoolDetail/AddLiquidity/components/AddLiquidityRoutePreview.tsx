import { API_URLS, Pool, Token, ZapRouteDetail } from '@kyber/schema'
import { rgba } from 'polished'
import { Fragment } from 'react'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import TooltipText from 'pages/Earns/PoolDetail/AddLiquidity/components/TooltipText'
import {
  formatBpsLabel,
  formatPercent,
  getInputTokenItems,
  getOutputTokenItems,
  getZapFeePercent,
} from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { formatDisplayNumber } from 'utils/numbers'

const FlowRow = styled(HStack)`
  width: 100%;
  align-items: center;

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

const StepPill = styled(Stack)`
  position: relative;
  z-index: 1;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.background};
`

const StepPillTop = styled(HStack)`
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.border, 0.4)};
`

type RouteTokenItem = {
  token: Token
  amount?: number
}

type AddLiquidityRoutePreviewProps = {
  inputTokens?: Token[]
  inputAmounts?: string
  pool?: Pool | null
  zapRoute?: ZapRouteDetail | null
  slippage?: number
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

const AddLiquidityRoutePreview = ({
  inputTokens,
  inputAmounts,
  pool,
  zapRoute,
  slippage,
}: AddLiquidityRoutePreviewProps) => {
  const theme = useTheme()

  const inputItems = getInputTokenItems(inputTokens ?? [], inputAmounts ?? '')
  const outputItems = getOutputTokenItems(pool, zapRoute)
  const zapFeePercent = getZapFeePercent(zapRoute)

  return (
    <FlowRow>
      <PreviewAssetCard items={inputItems} usdAmount={zapRoute?.zapDetails.initialAmountUsd} />

      <StepTrack>
        <TrackLine />
        <TrackStartDot />
        <StepPill>
          <StepPillTop>
            <KyberLogo width={18} height={18} />
            <Text color={theme.subText} fontSize={14} fontWeight={500}>
              Kyber Zap
            </Text>
          </StepPillTop>

          <Stack gap={8} p="8px 12px">
            <HStack align="center" justify="space-between" gap={16}>
              <TooltipText
                tooltip={
                  <Stack
                    gap={4}
                    align="flex-start"
                    sx={{
                      a: { color: 'primary', textDecoration: 'none' },
                    }}
                  >
                    Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                    fees.
                    <a href={API_URLS.DOCUMENT.ZAP_FEE_MODEL} target="_blank" rel="noopener norefferer noreferrer">
                      {'>'} More details
                    </a>
                  </Stack>
                }
                placement="left"
                color={theme.subText}
                fontSize={14}
              >
                Fee
              </TooltipText>
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                {formatPercent(zapFeePercent)}
              </Text>
            </HStack>
            <HStack align="center" justify="space-between" gap={16}>
              <TooltipText
                tooltip={
                  'Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!'
                }
                placement="left"
                color={theme.subText}
                fontSize={14}
              >
                Max Slippage
              </TooltipText>
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                {formatBpsLabel(slippage)}
              </Text>
            </HStack>
          </Stack>
        </StepPill>
      </StepTrack>

      <PreviewAssetCard items={outputItems} usdAmount={zapRoute?.positionDetails.addedAmountUsd} />
    </FlowRow>
  )
}

export default AddLiquidityRoutePreview
