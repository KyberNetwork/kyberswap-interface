import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { formatUnits } from 'viem'

import useTheme from 'hooks/useTheme'
import { Chain, SwapProvider } from 'pages/CrossChainSwap/adapters'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'
import { getNetworkInfo } from 'pages/CrossChainSwap/utils'
import { MEDIA_WIDTHS } from 'theme'
import { getNativeTokenLogo, getTokenLogoURL, isEvmChain } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

type KyberAcrossBridgeToken = {
  address: string
  symbol: string
  decimals: number
  chainId: number
}

type KyberAcrossBridge = {
  relayFeePct: string
  inputToken: KyberAcrossBridgeToken
  outputToken: KyberAcrossBridgeToken
  outputAmount: string
}

type KyberAcrossSwap = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
}

type KyberAcrossStep = {
  type: 'sourceSwap' | 'bridge' | 'destSwap'
  provider: string
  fromToken: string
  toToken: string
  fromChain: string
  toChain: string
  amountIn: string
  amountOut: string
  gasUsd: number
}

type KyberAcrossRawQuote = {
  bridge: KyberAcrossBridge | null
  sourceSwap: KyberAcrossSwap | null
  destSwap: KyberAcrossSwap | null
  steps: KyberAcrossStep[]
}

type TokenInfo = {
  symbol?: string
  decimals?: number
  logoURI?: string
  chainId?: number
  address?: string
  isNative?: boolean
}

type CurrencyLike = {
  symbol?: string
  decimals?: number
  logoURI?: string
  logo?: string
  icon?: string
  chainId?: number | string
  address?: string
  isNative?: boolean
}

type QuoteStep = {
  adapter: SwapProvider
  label: string
  type: 'sourceSwap' | 'bridge' | 'destSwap'
  toToken: TokenInfo | null
  toAmount: string
  toChain: string
}

type QuoteStepToken = {
  amount: string | null | undefined
  token: TokenInfo | null
  chainId?: number | string
}

type QuoteStepCardProps = {
  step: QuoteStep
  stepToken: QuoteStepToken | null
  quoteSlippage?: number
  bridgeFeePct?: string
}

const isSwapStepType = (stepType: string) => stepType === 'sourceSwap' || stepType === 'destSwap'
const isBridgeStepType = (stepType: string) => stepType === 'bridge'

const getStepLabel = (stepType: string) =>
  isSwapStepType(stepType) ? t`Swap via` : isBridgeStepType(stepType) ? t`Bridge via` : t`Route via`

const getStepInfoLabel = (stepType: string) =>
  isSwapStepType(stepType) ? t`Max Slippage` : isBridgeStepType(stepType) ? t`Fee` : t`Info`

const getStepInfoValue = (stepType: string, quoteSlippage?: number, bridgeFeePct?: string) =>
  isSwapStepType(stepType)
    ? formatSlippage(quoteSlippage)
    : isBridgeStepType(stepType)
    ? bridgeFeePct
      ? formatFeePctFromBridge(bridgeFeePct)
      : '--'
    : '--'

const getTokenInfoFromCurrency = (token?: CurrencyLike): TokenInfo | null => {
  if (!token) return null
  return {
    symbol: token.symbol,
    decimals: token.decimals,
    logoURI: token.logoURI || token.logo || token.icon,
    chainId: token.chainId as number,
    address: token.address,
    isNative: token.isNative,
  }
}

const formatTokenAmount = (amount: string | number | undefined, decimals?: number) => {
  if (!amount) return null
  if (typeof amount === 'number') {
    return formatDisplayNumber(amount, { significantDigits: 6 })
  }
  try {
    const formatted = formatUnits(BigInt(amount), decimals ?? 18)
    return formatDisplayNumber(formatted, { significantDigits: 6 })
  } catch (error) {
    return amount.toString()
  }
}

const formatSlippage = (value?: number) => {
  if (value === undefined || value === null) return '--'
  return formatDisplayNumber(value / 10_000, { style: 'percent', significantDigits: 3 })
}

const formatFeePctFromBridge = (pct?: string) => {
  if (!pct) return '--'
  try {
    const value = Number(pct) / 1e18
    return formatDisplayNumber(value, { style: 'percent', significantDigits: 3 })
  } catch (error) {
    return '--'
  }
}

const isNativeLikeAddress = (address?: string) => {
  if (!address) return false
  const lower = address.toLowerCase()
  return (
    lower === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || lower === '0x0000000000000000000000000000000000000000'
  )
}

const resolveTokenLogo = (token: TokenInfo | null) => {
  if (!token) return ''
  if (token.logoURI) return token.logoURI
  if (token.address && token.chainId !== undefined && isEvmChain(token.chainId)) {
    if (isNativeLikeAddress(token.address)) {
      return getNativeTokenLogo(token.chainId)
    }
    return getTokenLogoURL(token.address, token.chainId)
  }
  if (token.isNative && token.chainId !== undefined && isEvmChain(token.chainId)) {
    return getNativeTokenLogo(token.chainId)
  }
  return ''
}

const buildStepTokenInfo = (step: KyberAcrossStep, bridge?: KyberAcrossBridge | null): TokenInfo | null => {
  if (!step.toToken) return null
  const stepType = step.type?.toLowerCase?.() ?? ''
  const fromBridge = (token?: KyberAcrossBridgeToken | null) => {
    if (!token) return null
    const isNative = isNativeLikeAddress(step.toToken) || isNativeLikeAddress(token.address)
    return {
      address: isNative ? step.toToken : token.address,
      symbol: isNative ? token.symbol : token.symbol,
      decimals: token.decimals,
      chainId: token.chainId,
      isNative,
    }
  }

  if (stepType === 'sourceswap') return fromBridge(bridge?.inputToken) || { address: step.toToken }
  if (stepType === 'bridge') return fromBridge(bridge?.outputToken) || { address: step.toToken }

  return { address: step.toToken }
}

const QuoteTokenNode = ({ token, amount }: { token: TokenInfo | null; amount?: string | null }) => {
  if (!token) return null
  const logo = resolveTokenLogo(token)
  const networkInfo = token.chainId ? getNetworkInfo(token.chainId as Chain) : undefined
  const networkIcon = networkInfo?.icon || ''
  return (
    <TokenNode>
      <TokenIconWrapper>
        {logo && <TokenIcon src={logo} alt={token.symbol} />}
        {networkIcon && <ChainIcon src={networkIcon} alt="" />}
      </TokenIconWrapper>
      <Text>
        {formatDisplayNumber(amount, { significantDigits: 6 })} {token.symbol}
      </Text>
    </TokenNode>
  )
}

const QuoteStepCard = ({ step, stepToken, quoteSlippage, bridgeFeePct }: QuoteStepCardProps) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <ArrowTrack>
        <ArrowLine />
        <StepCard>
          <StepTitle onClick={() => setOpen(prev => !prev)}>
            <StepTitleLeft>
              <Text color={theme.subText}>{step.label}</Text>
              <StepTitleProvider>
                <img src={step.adapter.getIcon()} alt={step.adapter.getName()} width={16} height={16} />
                <Text>{step.adapter.getName()}</Text>
              </StepTitleProvider>
            </StepTitleLeft>
            <StepTitleIcon>
              {open ? <ChevronUp size={14} color={theme.subText} /> : <ChevronDown size={14} color={theme.subText} />}
            </StepTitleIcon>
          </StepTitle>
          <StepDetails data-open={open ? 'true' : 'false'}>
            <StepDetailRow>
              <Text>{getStepInfoLabel(step.type)}</Text>
              <Text>{getStepInfoValue(step.type, quoteSlippage, bridgeFeePct)}</Text>
            </StepDetailRow>
          </StepDetails>
        </StepCard>
      </ArrowTrack>
      {stepToken && <QuoteTokenNode token={stepToken.token} amount={stepToken.amount} />}
    </>
  )
}

export default function QuoteSteps({ quote }: { quote?: Quote | null }) {
  const rawQuote = quote?.quote?.rawQuote as KyberAcrossRawQuote | undefined

  const quoteSteps = useMemo((): QuoteStep[] => {
    const steps = rawQuote?.steps
    if (!Array.isArray(steps) || steps.length === 0) return []

    return steps
      .map(step => {
        const adapter = registry.getAdapter(step.provider) as SwapProvider
        const toToken = buildStepTokenInfo(step, rawQuote?.bridge)
        return {
          adapter,
          label: getStepLabel(step.type),
          type: step.type,
          toToken,
          toAmount: step.amountOut,
          toChain: step.toChain,
        }
      })
      .filter(step => !!step.adapter)
  }, [rawQuote])

  if (quoteSteps.length === 0) return null

  const quoteParams = quote?.quote?.quoteParams
  const quoteFromToken = getTokenInfoFromCurrency(quoteParams?.fromToken)
  const quoteToToken = getTokenInfoFromCurrency(quoteParams?.toToken)
  const inputAmount = formatTokenAmount(quoteParams?.amount, quoteFromToken?.decimals)

  return (
    <FlowRow>
      <QuoteTokenNode token={quoteFromToken} amount={inputAmount} />
      {quoteSteps.map((step, index) => {
        const isLastStep = index === quoteSteps.length - 1
        const stepToken = isLastStep
          ? {
              amount: quote?.quote?.formattedOutputAmount,
              token: quoteToToken,
              chainId: quoteParams?.toChain,
            }
          : step.toToken
          ? {
              amount: step.toAmount ? formatTokenAmount(step.toAmount, step.toToken.decimals) : null,
              token: step.toToken,
              chainId: step.toChain,
            }
          : null

        return (
          <Fragment key={`${step.adapter.getName()}-${index}`}>
            <QuoteStepCard
              step={step}
              stepToken={stepToken}
              quoteSlippage={quoteParams?.slippage}
              bridgeFeePct={rawQuote?.bridge?.relayFeePct}
            />
          </Fragment>
        )
      })}
    </FlowRow>
  )
}

const FlowRow = styled(Flex)`
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 8px;
  margin-bottom: 12px;

  @media (max-width: ${MEDIA_WIDTHS.upToSmall}px) {
    flex-direction: column;
  }
`

const TokenNode = styled(Flex)`
  height: 36px;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const TokenIconWrapper = styled.div`
  position: relative;
  width: 18px;
  height: 18px;
`

const TokenIcon = styled.img`
  width: 18px;
  height: 18px;
  border-radius: 50%;
`

const ChainIcon = styled.img`
  position: absolute;
  right: -4px;
  bottom: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
`

const StepCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.background};
  position: relative;
  @media (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin: 0 8px;
  }
`

const StepTitle = styled(Flex)`
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  justify-content: space-between;
`

const StepTitleLeft = styled(Flex)`
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

const StepTitleProvider = styled(Flex)`
  align-items: center;
  gap: 4px;
`

const StepTitleIcon = styled(Flex)`
  align-items: center;
  min-height: 18px;
  min-width: 14px !important;
`

const StepDetailRow = styled(Flex)`
  justify-content: space-between;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding-top: 4px;
  border-top: 1px dashed ${({ theme }) => rgba(theme.subText, 0.3)};
`

const StepDetails = styled.div`
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 200ms ease;

  &[data-open='true'] {
    max-height: 80px;
    opacity: 1;
    padding-top: 4px;
  }
`

const ArrowTrack = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
`

const ArrowLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 18px;
  height: 2px;
  background: ${({ theme }) => theme.border};
  opacity: 0.65;
  &::after {
    content: '';
    position: absolute;
    right: -2px;
    top: 50%;
    transform: translateY(-50%);
    border-left: 6px solid ${({ theme }) => theme.border};
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    opacity: 0.65;
  }

  @media (max-width: ${MEDIA_WIDTHS.upToSmall}px) {
    left: 24px;
    right: auto;
    top: -12px;
    width: 2px;
    height: calc(100% + 24px);
    &::after {
      right: auto;
      left: 50%;
      top: auto;
      bottom: -2px;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 6px solid ${({ theme }) => theme.border};
      border-bottom: 0;
    }
  }
`
