import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { useGetPricesQuery, useGetTokenCategoryQuery } from 'services/tokenCatalog'

import CopyHelper from 'components/Copy'
import Tooltip from 'components/Tooltip'
import { PAIR_CATEGORY } from 'constants/trade'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

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

  const { data: priceData, isFetching: isFetchingPrice } = useGetPricesQuery(
    { [token.chainId]: [token.address] },
    { pollingInterval: 15_000 },
  )
  const priceInfo = useMemo(() => {
    if (!priceData) return null
    const entry = priceData.data?.[token.chainId]?.[token.address]
    const buyPrice = entry?.PriceBuy
    const sellPrice = entry?.PriceSell
    const spread =
      buyPrice === undefined || sellPrice === undefined
        ? undefined
        : (Math.abs(buyPrice - sellPrice) / ((buyPrice + sellPrice) / 2)) * 100
    return { buyPrice, sellPrice, spread }
  }, [priceData, token.chainId, token.address])

  const { data: categoryData } = useGetTokenCategoryQuery({ chainId: token.chainId, tokens: token.address })
  const tokenCategory = useMemo(
    () =>
      (categoryData?.find(item => item.token.toLowerCase() === token.address.toLowerCase())?.category as
        | TOKEN_CATEGORY
        | undefined) ?? null,
    [categoryData, token.address],
  )

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

  // Flag a genuinely high spread, or a missing price — but only once the price fetch has SETTLED.
  // While the just-selected token's price is still loading, the icon must not glow warning (it
  // briefly did, since the price hadn't arrived yet to compute the spread).
  const isWarning =
    !!spreadCheck.warning || (priceInfo && !isFetchingPrice ? !priceInfo.buyPrice || !priceInfo.sellPrice : false)

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
