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
  totalRelayFee?: {
    pct?: string
  }
  inputToken?: KyberAcrossBridgeToken
  outputToken?: KyberAcrossBridgeToken
}

type KyberAcrossStep = {
  type?: string
  provider?: string
  fromToken?: string
  toToken?: string
  fromChain?: string
  toChain?: string
  amountIn?: string
  amountOut?: string
  gasUsd?: number
  slippage?: number
  feePercent?: number
  feeBps?: number
  toAmount?: string
  outputAmount?: string
  toTokenAmount?: string
}

type KyberAcrossRawQuote = {
  bridge?: KyberAcrossBridge
  steps?: KyberAcrossStep[]
}

type TokenInfo = {
  symbol?: string
  decimals?: number
  logoURI?: string
  chainId?: number | string
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
  type: string
  toToken: TokenInfo | null
  toAmount: string | undefined
  slippage: number | undefined
  feePercent: number | undefined
  feeBps: number | undefined
  toChain: string | undefined
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
  platformFeePercent?: number
}

const getTokenInfoFromCurrency = (token?: CurrencyLike): TokenInfo | null => {
  if (!token) return null
  return {
    symbol: token.symbol,
    decimals: token.decimals,
    logoURI: token.logoURI || token.logo || token.icon,
    chainId: token.chainId,
    address: token.address,
    isNative: token.isNative,
  }
}

const getTokenInfoFromStep = (step: KyberAcrossStep, key: 'fromToken' | 'toToken'): TokenInfo | null => {
  const token = step[key]
  if (!token) return null
  return { address: token }
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

const formatFeePercent = (feePercent?: number, feeBps?: number) => {
  if (feeBps !== undefined && feeBps !== null) {
    return formatDisplayNumber(feeBps / 10_000, { style: 'percent', significantDigits: 3 })
  }
  if (feePercent === undefined || feePercent === null) return '--'
  const normalized = feePercent > 1 ? feePercent / 100 : feePercent
  return formatDisplayNumber(normalized, { style: 'percent', significantDigits: 3 })
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

const resolveTokenLogo = (token: TokenInfo | null, fallbackChain?: number | string) => {
  if (!token) return ''
  if (token.logoURI) return token.logoURI
  if (token.address && typeof fallbackChain === 'number' && isEvmChain(fallbackChain)) {
    if (isNativeLikeAddress(token.address)) {
      return getNativeTokenLogo(fallbackChain)
    }
    return getTokenLogoURL(token.address, fallbackChain)
  }
  if (token.isNative && typeof fallbackChain === 'number' && isEvmChain(fallbackChain)) {
    return getNativeTokenLogo(fallbackChain)
  }
  return ''
}

const QuoteTokenNode = ({
  token,
  amount,
  chainId,
}: {
  token: TokenInfo | null
  amount?: string | null
  chainId?: number | string
}) => {
  if (!token) return null
  const logo = resolveTokenLogo(token, chainId)
  const networkIcon = chainId ? getNetworkInfo(chainId as Chain).icon : ''
  return (
    <TokenNode>
      <TokenIconWrapper>
        {logo && <TokenIcon src={logo} alt={token.symbol} />}
        {networkIcon && <ChainIcon src={networkIcon} alt="" />}
      </TokenIconWrapper>
      <Text>
        {amount || '--'} {token.symbol || ''}
      </Text>
    </TokenNode>
  )
}

const QuoteStepCard = ({ step, stepToken, quoteSlippage, bridgeFeePct, platformFeePercent }: QuoteStepCardProps) => {
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
              <img src={step.adapter.getIcon()} alt={step.adapter.getName()} width={16} height={16} />
              <Text>{step.adapter.getName()}</Text>
            </StepTitleLeft>
            {open ? <ChevronUp size={14} color={theme.subText} /> : <ChevronDown size={14} color={theme.subText} />}
          </StepTitle>
          <StepDetails data-open={open ? 'true' : 'false'}>
            <StepDetailRow>
              <Text>{step.type === 'sourceswap' ? t`Max Slippage` : step.type === 'bridge' ? t`Fee` : t`Info`}</Text>
              <Text>
                {step.type === 'sourceswap'
                  ? formatSlippage(step.slippage ?? quoteSlippage)
                  : step.type === 'bridge'
                  ? bridgeFeePct
                    ? formatFeePctFromBridge(bridgeFeePct)
                    : formatFeePercent(step.feePercent ?? platformFeePercent, step.feeBps)
                  : '--'}
              </Text>
            </StepDetailRow>
          </StepDetails>
        </StepCard>
      </ArrowTrack>
      {stepToken && <QuoteTokenNode token={stepToken.token} amount={stepToken.amount} chainId={stepToken.chainId} />}
    </>
  )
}

export default function QuoteSteps({ quote }: { quote?: Quote | null }) {
  const rawQuote = (quote?.quote?.rawQuote || undefined) as KyberAcrossRawQuote | undefined

  const quoteSteps = useMemo((): QuoteStep[] => {
    const steps = rawQuote?.steps
    if (!Array.isArray(steps)) return []
    const bridgeInputToken = rawQuote?.bridge?.inputToken
    const bridgeOutputToken = rawQuote?.bridge?.outputToken

    return steps
      .map(step => {
        const providerName = typeof step?.provider === 'string' ? step.provider : null
        if (!providerName) return null
        const adapter = registry.getAdapter(providerName)
        if (!adapter) return null

        const stepType = typeof step?.type === 'string' ? step.type.toLowerCase() : ''
        const toToken =
          stepType === 'bridge' && bridgeOutputToken
            ? {
                symbol: bridgeOutputToken.symbol,
                decimals: bridgeOutputToken.decimals,
                chainId: bridgeOutputToken.chainId,
                address: bridgeOutputToken.address,
              }
            : stepType === 'sourceswap' && bridgeInputToken
            ? {
                symbol: bridgeInputToken.symbol,
                decimals: bridgeInputToken.decimals,
                chainId: bridgeInputToken.chainId,
                address: bridgeInputToken.address,
              }
            : getTokenInfoFromStep(step, 'toToken')

        const label = stepType === 'sourceswap' ? t`Swap via` : stepType === 'bridge' ? t`Bridge via` : t`Route via`
        return {
          adapter,
          label,
          type: stepType,
          toToken,
          toAmount: step.toAmount || step.amountOut || step.outputAmount || step.toTokenAmount,
          slippage: step?.slippage,
          feePercent: step?.feePercent,
          feeBps: step?.feeBps,
          toChain: step?.toChain,
        }
      })
      .filter((step): step is QuoteStep => step !== null)
  }, [rawQuote])

  if (quoteSteps.length === 0) return null

  const quoteParams = quote?.quote?.quoteParams
  const fallbackFromToken = getTokenInfoFromCurrency(quoteParams?.fromToken)
  const fallbackToToken = getTokenInfoFromCurrency(quoteParams?.toToken)
  const inputAmount = formatTokenAmount(quoteParams?.amount, fallbackFromToken?.decimals)
  const outputAmount = quote?.quote?.formattedOutputAmount
  const bridgeFeePct = rawQuote?.bridge?.totalRelayFee?.pct

  return (
    <FlowRow>
      <QuoteTokenNode token={fallbackFromToken} amount={inputAmount} chainId={quoteParams?.fromChain} />
      {quoteSteps.map((step, index) => {
        const stepToken =
          step.toToken && step.toAmount
            ? {
                amount: formatTokenAmount(step.toAmount, step.toToken.decimals),
                token: step.toToken,
                chainId: step.toToken.chainId ?? step.toChain,
              }
            : index === quoteSteps.length - 1
            ? {
                amount: outputAmount,
                token: fallbackToToken,
                chainId: quoteParams?.toChain,
              }
            : null

        return (
          <Fragment key={`${step.adapter.getName()}-${index}`}>
            <QuoteStepCard
              step={step}
              stepToken={stepToken}
              quoteSlippage={quoteParams?.slippage}
              bridgeFeePct={bridgeFeePct}
              platformFeePercent={quote?.quote?.platformFeePercent}
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
  min-width: 200px;
  padding: 10px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.background};
  position: relative;
  z-index: 1;
`

const StepTitle = styled(Flex)`
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  justify-content: space-between;
`

const StepTitleLeft = styled(Flex)`
  align-items: center;
  gap: 6px;
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
    display: none;
  }
`
