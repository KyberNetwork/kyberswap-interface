import { Currency } from '@kyberswap/ks-sdk-core'
import { CSSProperties, useMemo } from 'react'
import { useMedia } from 'react-use'

import CurrencyLogo from 'components/CurrencyLogo'
import { LimitOrderFromTokenPairFormatted } from 'components/swapv2/LimitOrder/type'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export const ItemWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[1fr_2fr_2fr_2fr_1fr] p-3 text-sm leading-5 max-[500px]:grid-cols-[1.2fr_1.8fr_2fr_1.8fr]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ChainImage = ({ className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  // eslint-disable-next-line jsx-a11y/alt-text
  <img className={cn('relative left-2.5 top-0.5 size-4', className)} {...rest} />
)

const AmountInfo = ({
  plus,
  amount,
  currency,
  upToExtraSmall,
}: {
  plus?: boolean
  amount: string
  currency?: Currency
  upToExtraSmall?: boolean
}) => (
  <div className="flex items-center">
    <CurrencyLogo currency={currency} size="17px" style={{ marginRight: upToExtraSmall ? 4 : 8 }} />
    <span>{plus ? '+' : '-'}</span>
    <span>{amount}</span>
  </div>
)

export default function OrderItem({
  reverse,
  order,
  style,
}: {
  reverse?: boolean
  order: LimitOrderFromTokenPairFormatted
  style: CSSProperties
}) {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()

  const chain = useMemo(() => NETWORKS_INFO[order.chainId], [order.chainId])

  return (
    <ItemWrapper style={style}>
      <ChainImage src={chain?.icon} alt="Network" />
      <div className={reverse ? 'text-primary' : 'text-red'}>{order.rate}</div>
      <AmountInfo
        plus={reverse}
        amount={order[!reverse ? 'makerAmount' : 'takerAmount']}
        currency={makerCurrency}
        upToExtraSmall={upToExtraSmall}
      />
      <AmountInfo
        plus={!reverse}
        amount={order[!reverse ? 'takerAmount' : 'makerAmount']}
        currency={takerCurrency}
        upToExtraSmall={upToExtraSmall}
      />
      {!upToExtraSmall && <span className="text-subText">Filled {order.filled}%</span>}
    </ItemWrapper>
  )
}
