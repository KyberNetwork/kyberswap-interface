import { t } from '@lingui/macro'
import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { formatUnits } from 'viem'

import useTheme from 'hooks/useTheme'
import { Chain, SwapProvider } from 'pages/CrossChainSwap/adapters'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'
import { getNetworkInfo } from 'pages/CrossChainSwap/utils'
import { getNativeTokenLogo, getTokenLogoURL, isEvmChain } from 'utils'
import { cn } from 'utils/cn'
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
    <div className="flex h-9 items-center gap-1.5 text-base font-medium text-text">
      <div className="relative h-[18px] w-[18px]">
        {logo && <img className="h-[18px] w-[18px] rounded-full" src={logo} alt={token.symbol} />}
        {networkIcon && <img className="absolute -right-1 bottom-0 size-3 rounded-full" src={networkIcon} alt="" />}
      </div>
      <span>
        {formatDisplayNumber(amount, { significantDigits: 6 })} {token.symbol}
      </span>
    </div>
  )
}

const QuoteStepCard = ({ step, stepToken, quoteSlippage, bridgeFeePct }: QuoteStepCardProps) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="relative flex flex-1 items-start justify-center">
        <div
          className={cn(
            'absolute inset-x-0 top-[18px] h-0.5 bg-border opacity-65',
            'after:absolute after:right-[-2px] after:top-1/2 after:-translate-y-1/2 after:border-y-4 after:border-l-[6px] after:border-y-transparent after:border-l-border after:opacity-65 after:content-[""]',
            'max-sm:bottom-auto max-sm:left-6 max-sm:right-auto max-sm:top-[-12px] max-sm:h-[calc(100%+24px)] max-sm:w-0.5',
            'max-sm:after:bottom-[-2px] max-sm:after:left-1/2 max-sm:after:right-auto max-sm:after:top-auto max-sm:after:-translate-x-1/2 max-sm:after:translate-y-0 max-sm:after:border-x-4 max-sm:after:border-b-0 max-sm:after:border-t-[6px] max-sm:after:border-x-transparent max-sm:after:border-t-border',
          )}
        />
        <div className="relative mx-0 flex flex-col rounded-2xl bg-background px-3 py-2.5 sm:mx-2">
          <div
            className="flex cursor-pointer items-start justify-between gap-1.5 text-sm font-medium"
            onClick={() => setOpen(prev => !prev)}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-subText">{step.label}</span>
              <div className="flex items-center gap-1">
                <img src={step.adapter.getIcon()} alt={step.adapter.getName()} width={16} height={16} />
                <span>{step.adapter.getName()}</span>
              </div>
            </div>
            <div className="flex min-h-[18px] min-w-[14px] items-center">
              {open ? <ChevronUp size={14} color={theme.subText} /> : <ChevronDown size={14} color={theme.subText} />}
            </div>
          </div>
          <div
            data-open={open ? 'true' : 'false'}
            className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 data-[open=true]:max-h-20 data-[open=true]:pt-1 data-[open=true]:opacity-100"
          >
            <div className="border-gray/30 flex justify-between border-t border-dashed pt-1 text-xs text-subText">
              <span>{getStepInfoLabel(step.type)}</span>
              <span>{getStepInfoValue(step.type, quoteSlippage, bridgeFeePct)}</span>
            </div>
          </div>
        </div>
      </div>
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
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3 px-2 max-sm:flex-col">
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
    </div>
  )
}
