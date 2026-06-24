import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { Clock } from 'components/Icons'
import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { useLimitOrderChainId } from 'components/LimitOrder/LimitOrderContext'
import { OrderSummary } from 'components/LimitOrder/components'
import { LimitOrder } from 'components/LimitOrder/types'
import { DOCS_LINKS, formatAmountOrder } from 'components/LimitOrder/utils'
import Logo from 'components/Logo'
import { HStack, Stack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useInterval from 'hooks/useInterval'
import { ExternalLink } from 'theme'
import { formatRemainTime } from 'utils/time'

type OrderAmountProps = {
  logo: string
  amount: string
  decimals: number
  symbol: string
}

const OrderAmount = ({ logo, amount, decimals, symbol }: OrderAmountProps) => (
  <div className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-medium text-text">
    <Logo srcs={[logo]} style={{ width: 20, height: 20 }} />
    <span>
      {formatAmountOrder(amount, decimals)} {symbol}
    </span>
  </div>
)

export const SingleOrderSummary = ({ order }: { order?: LimitOrder }) => {
  const chainId = useLimitOrderChainId(order?.chainId)
  const currencyIn = useCurrencyV2(order?.makerAsset, chainId) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset, chainId) || undefined
  const { tradeInfo: marketPrice } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  if (!order) return null

  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order

  const native = NativeCurrencies[Number(order.chainId) as ChainId]
  const isNative = order.nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  const takerSymbol = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol
  const takerLogo = isNative ? NETWORKS_INFO[order.chainId]?.nativeToken.logo || takerAssetLogoURL : takerAssetLogoURL

  return (
    <OrderSummary
      inputCurrency={
        <OrderAmount
          logo={makerAssetLogoURL}
          amount={makingAmount}
          decimals={makerAssetDecimals}
          symbol={makerAssetSymbol}
        />
      }
      outputCurrency={
        <OrderAmount logo={takerLogo} amount={takingAmount} decimals={takerAssetDecimals} symbol={takerSymbol} />
      }
      order={order}
      marketRate={<MarketPrice price={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />}
    />
  )
}

type ChainFilterProps = {
  options: { chainId: ChainId; count: number }[]
  selectedChainId: ChainId | undefined
  totalOrders: number
  disabled?: boolean
  onChange: (chainId: ChainId) => void
}

export const ChainFilter = ({ options, selectedChainId, totalOrders, disabled, onChange }: ChainFilterProps) => {
  if (!options.length) return null

  return (
    <Stack className="gap-2">
      <HStack className="items-center justify-between gap-4 pr-4 font-medium text-text">
        <span>
          <Trans>All Orders</Trans>
        </span>
        <span>{totalOrders}</span>
      </HStack>

      <Stack className="gap-1" role="radiogroup">
        {options.map(({ chainId, count }) => {
          const selected = chainId === selectedChainId
          const network = NETWORKS_INFO[chainId]

          return (
            <button
              key={chainId}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              className="flex min-h-8 w-full cursor-pointer items-center justify-between gap-3 rounded-xl bg-white-04 px-4 py-2 text-sm text-text outline-none transition-colors hover:bg-white-08"
              onClick={() => onChange(chainId)}
            >
              <HStack className="min-w-0 items-center gap-2">
                <span className={selected ? 'text-primary' : 'text-subText'}>
                  {selected ? (
                    <RadioButtonChecked size={18} className="text-primary" />
                  ) : (
                    <RadioButtonUnchecked size={18} />
                  )}
                </span>
                <img className="size-4 shrink-0" src={network.icon} alt={network.name} />
                <span className="min-w-0 truncate">{network.name}</span>
              </HStack>
              <span className="shrink-0">{count}</span>
            </button>
          )
        })}
      </Stack>
    </Stack>
  )
}

const getRemainTime = (expiredTime: number) => Math.max(0, Math.floor(expiredTime - Date.now() / 1000))

type CancelStatusCountDownProps = {
  expiredTime: number
  onCountdownEnd: () => void
}

export const CancelStatusCountDown = ({ expiredTime, onCountdownEnd }: CancelStatusCountDownProps) => {
  const [remain, setRemain] = useState(() => getRemainTime(expiredTime))

  useEffect(() => {
    setRemain(getRemainTime(expiredTime))
  }, [expiredTime])

  const countdown = useCallback(() => {
    setRemain(v => {
      if (v <= 1) {
        onCountdownEnd()
        return 0
      }
      return v - 1
    })
  }, [onCountdownEnd])

  useInterval(countdown, remain > 0 ? 1000 : null)

  if (!remain) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-darkBorder bg-white-04 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-text">
        <Trans>Order will be automatically cancelled in</Trans>
        <span className="inline-flex items-center gap-2 text-red">
          <Clock className="text-red" size={16} />
          <span>{formatRemainTime(remain)}</span>
        </span>
      </div>
      <span className="text-xs text-subText">
        <Trans>Note: There is a possibility that the order might be filled before cancellation.</Trans>{' '}
        <ExternalLink href={DOCS_LINKS.CANCEL_GUIDE}>
          <Trans>Learn more ↗︎</Trans>
        </ExternalLink>
      </span>
    </div>
  )
}
