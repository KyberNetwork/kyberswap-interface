import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import Tooltip from 'components/Tooltip'
import { TOKEN_API_URL } from 'constants/env'
import { PAIR_CATEGORY } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

interface PriceResponse {
  data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } }
}

enum TOKEN_CATEGORY {
  STABLE = 'stablePair',
  COMMON = 'commonPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
}

const SPREAD_THRESHOLD = {
  [TOKEN_CATEGORY.STABLE]: 0.5,
  [TOKEN_CATEGORY.COMMON]: 1.5,
  [TOKEN_CATEGORY.EXOTIC]: 3,
  [TOKEN_CATEGORY.HIGH_VOLATILITY]: 5,
}

export default function TokenInfo({ token, isNativeToken = false }: { token: Token; isNativeToken?: boolean }) {
  const theme = useTheme()

  const [tokenCategory, setTokenCategory] = useState<TOKEN_CATEGORY | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ buyPrice?: number; sellPrice?: number; spread?: number } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(infoRef, () => setShowTooltip(false))

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const spreadThreshold = useMemo(
    () => (!tokenCategory ? null : SPREAD_THRESHOLD[tokenCategory] || SPREAD_THRESHOLD[PAIR_CATEGORY.EXOTIC]),
    [tokenCategory],
  )

  const spreadCheck = useMemo(
    () => ({
      warning:
        spreadThreshold && priceInfo?.spread && priceInfo?.buyPrice && priceInfo?.sellPrice
          ? priceInfo.spread > spreadThreshold && priceInfo.buyPrice > priceInfo.sellPrice
          : false,
      display:
        priceInfo?.spread && priceInfo?.buyPrice && priceInfo?.sellPrice
          ? priceInfo.buyPrice > priceInfo.sellPrice
          : false,
    }),
    [priceInfo?.buyPrice, priceInfo?.sellPrice, priceInfo?.spread, spreadThreshold],
  )

  useEffect(() => {
    const getOnChainPrice = async () => {
      const r: PriceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
        method: 'POST',
        body: JSON.stringify({
          [token.chainId]: [token.address],
        }),
      }).then(res => res.json())

      const buyPrice = r.data[token.chainId][token.address]?.PriceBuy
      const sellPrice = r.data[token.chainId][token.address]?.PriceSell

      const spread =
        buyPrice === undefined || sellPrice === undefined
          ? undefined
          : (Math.abs(buyPrice - sellPrice) / ((buyPrice + sellPrice) / 2)) * 100

      setPriceInfo({ buyPrice, sellPrice, spread })
    }

    getOnChainPrice()
    const fetchPriceInterval = setInterval(getOnChainPrice, 15_000)

    return () => clearInterval(fetchPriceInterval)
  }, [token.address, token.chainId])

  useEffect(() => {
    if (!token) return

    const getTokenCategory = async () => {
      const r = await fetch(
        `${TOKEN_API_URL}/v1/public/category/token?tokens=${token.address}&chainId=${token.chainId}`,
      ).then(res => res.json())

      const cat = r.data.find((item: any) => item.token.toLowerCase() === token.address.toLowerCase())?.category

      if (cat) setTokenCategory(cat as TOKEN_CATEGORY)
    }

    getTokenCategory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.address])

  const tooltipContent = (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <span>{isNativeToken ? t`Native token` : shortenAddress(token?.wrapped.address || '', 6)}</span>
        {!isNativeToken ? <CopyHelper size={14} toCopy={token?.wrapped.address} /> : null}
      </div>
      <div className="flex items-center gap-1">
        <span>{t`Buy`}:</span>
        <span className={priceInfo?.buyPrice ? 'text-primary' : 'text-warning'}>
          {priceInfo?.buyPrice
            ? formatDisplayNumber(priceInfo?.buyPrice, { significantDigits: 8, style: 'currency' })
            : t`N/A`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span>{t`Sell`}:</span>
        <span className={priceInfo?.sellPrice ? 'text-blue' : 'text-warning'}>
          {priceInfo?.sellPrice
            ? formatDisplayNumber(priceInfo?.sellPrice, { significantDigits: 8, style: 'currency' })
            : t`N/A`}
        </span>
      </div>
      {spreadCheck.display ? (
        <div className="flex items-center gap-1">
          <span>{t`Spread`}:</span>
          <span className={spreadCheck.warning ? 'text-warning' : 'text-text'}>
            {priceInfo?.spread ? formatDisplayNumber(priceInfo?.spread, { significantDigits: 2 }) + '%' : t`N/A`}
          </span>
        </div>
      ) : null}
      {spreadCheck.warning ? (
        <span className="italic text-warning">
          <Trans>
            The current difference between buy and sell is{' '}
            {formatDisplayNumber(priceInfo?.spread, { significantDigits: 2 })}% of the mid point, which might be higher
            than usual for similar tokens.
          </Trans>
        </span>
      ) : null}
    </div>
  )

  const isWarning = !!spreadCheck.warning || (priceInfo ? !priceInfo.buyPrice || !priceInfo.sellPrice : false)

  return (
    <div
      className="flex size-fit"
      role="button"
      ref={infoRef}
      onClick={e => {
        e.stopPropagation()
        setShowTooltip(prev => !prev)
      }}
    >
      <Tooltip
        show={showTooltip}
        text={tooltipContent}
        delay={200}
        placement="top"
        width="fit-content"
        maxWidth={upToSmall ? '280px' : '400px'}
      >
        <Info
          color={isWarning ? theme.warning : theme.subText}
          size={18}
          className={cn(isWarning && 'animate-token-info-glow')}
        />
      </Tooltip>
    </div>
  )
}
