import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import InfoHelper from 'components/InfoHelper'
import Logo from 'components/Logo'
import ProgressBar from 'components/ProgressBar'
import ActionButtons from 'components/swapv2/LimitOrder/ListOrder/ActionButtons'
import {
  calcPercentFilledOrder,
  formatAmountOrder,
  formatRateLimitOrder,
  isActiveStatus,
} from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { useTokenBalance } from 'state/wallet/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { toCurrencyAmount } from 'utils/currencyAmount'

type Theme = ReturnType<typeof useTheme>

interface ItemWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  hasBorder?: boolean
  active?: boolean
  highlight?: boolean
}

export const ItemWrapper = ({
  hasBorder,
  active,
  highlight,
  className,
  children,
  style,
  ...rest
}: ItemWrapperProps) => (
  <div
    data-highlight={highlight}
    style={{
      gridTemplateColumns: active ? '1.5fr 1fr 1.5fr 2fr 110px' : '1.5fr 1fr 1.5fr 2fr 80px',
      ...style,
    }}
    className={cn(
      'grid cursor-pointer items-center gap-[10px] p-[10px] text-xs hover:bg-primary-20',
      hasBorder ? 'border-b border-border' : 'border-b border-transparent',
      active ? 'max-lg:!grid-cols-[1.5fr_1.5fr_1.5fr_110px]' : 'max-lg:!grid-cols-[1.5fr_1.5fr_1.5fr_80px]',
      '[&_.rate]:max-lg:hidden',
      'data-[highlight=true]:animate-[ks-order-highlight_2s_2_alternate_ease-in-out]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const ItemWrapperMobile = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col justify-between gap-[14px] border-b border-border px-[10px] py-5 text-xs', className)}
    {...rest}
  >
    {children}
  </div>
)

const DeltaAmount = ({
  color,
  className,
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => (
  <div className={cn('font-medium', className)} style={color ? { color, ...style } : style} {...rest}>
    {children}
  </div>
)

const Colum = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col justify-center gap-x-3 gap-y-[10px] max-sm:gap-y-[5px]', className)} {...rest}>
    {children}
  </div>
)

const TimeText = ({ time, style = {} }: { time: number; style?: CSSProperties }) => {
  return (
    <div className="flex font-medium text-text" style={style}>
      <span>{dayjs(time * 1000).format('DD/MM/YYYY')}</span>
      &nbsp; <span>{dayjs(time * 1000).format('HH:mm')}</span>
    </div>
  )
}

const TokenLogo = ({ srcs }: { srcs: string[] }) => <Logo srcs={srcs} className="mr-2 h-[17px] w-[17px] rounded-full" />

const SingleAmountInfo = ({
  amount,
  color,
  className,
  logoUrl,
  symbol,
  plus = true,
  hideLogo = false,
  decimals,
}: {
  amount: string
  color?: string
  className?: string
  symbol: string
  logoUrl: string
  plus?: boolean
  hideLogo?: boolean
  decimals: number
}) => (
  <div className="flex items-center">
    {!hideLogo && <TokenLogo srcs={[logoUrl]} />}
    <DeltaAmount color={color} className={className}>
      {plus ? '+' : '-'} {formatAmountOrder(amount, decimals)} {symbol || '???'}
    </DeltaAmount>
  </div>
)
const AmountInfo = ({ order, takerSymbol }: { order: LimitOrder; takerSymbol: string }) => {
  const {
    makerAssetSymbol,
    makerAssetLogoURL,
    takerAssetLogoURL,
    takerAssetSymbol,
    makingAmount,
    takingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
    nativeOutput,
    chainId,
  } = order
  const native = NativeCurrencies[chainId]
  const isNative = nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  return (
    <Colum>
      <SingleAmountInfo
        decimals={takerAssetDecimals}
        className="text-primary"
        logoUrl={isNative ? NETWORKS_INFO[order.chainId]?.nativeToken.logo || takerAssetLogoURL : takerAssetLogoURL}
        amount={takingAmount}
        symbol={takerSymbol}
      />
      <SingleAmountInfo
        decimals={makerAssetDecimals}
        plus={false}
        className="text-subText"
        logoUrl={makerAssetLogoURL}
        amount={makingAmount}
        symbol={makerAssetSymbol}
      />
    </Colum>
  )
}

const TradeRateOrder = ({
  order,
  symbolOut,
  style = {},
}: {
  order: LimitOrder
  symbolOut: string
  style?: CSSProperties
}) => {
  const [invert, setInvert] = useState(false)
  const symbolIn = order.makerAssetSymbol || '???'

  const onInvert = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    setInvert(!invert)
  }

  return (
    <Colum style={style} onClick={event => event.stopPropagation()}>
      <div className="flex cursor-pointer items-center gap-[6px]" onClick={onInvert}>
        <span className="text-text">{!invert ? `${symbolOut}/${symbolIn}` : `${symbolIn}/${symbolOut}`}</span>
        <Repeat className="text-text" size={12} />
      </div>
      <span className="text-text">{formatRateLimitOrder(order, invert)}</span>
    </Colum>
  )
}

function formatStatus(status: string) {
  status = status.replace('_', ' ')
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getNeededMakingAmount(order: LimitOrder) {
  const makingToken = new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  const makingAmount = toCurrencyAmount(makingToken, order.makingAmount)
  const filledMakingAmount = toCurrencyAmount(makingToken, order.filledMakingAmount)

  return makingAmount.subtract(filledMakingAmount)
}

function formatStatusLimitOrder(order: LimitOrder, isCancelling = false, isNotSufficientFund = false) {
  const { takingAmount, filledTakingAmount, takerAssetDecimals } = order
  const filledPercent = calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals)
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const partiallyFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const expandTitle = [LimitOrderStatus.EXPIRED, LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING].includes(
    status,
  )
    ? ` | ${formatStatus(status)}`
    : isNotSufficientFund && status !== LimitOrderStatus.FILLED
    ? `, ${t`insufficient funds`}`
    : ''
  return `${partiallyFilled ? t`Partially Filled` : t`Filled`} ${filledPercent}%${expandTitle}`
}

const getColorStatus = (status: LimitOrderStatus, theme: Theme, isNotSufficientFund = false) => {
  const MapStatusColor: { [key: string]: string } = {
    [LimitOrderStatus.FILLED]: theme.primary,
    [LimitOrderStatus.CANCELLED]: theme.red,
    [LimitOrderStatus.CANCELLING]: theme.red,
    [LimitOrderStatus.EXPIRED]: theme.warning,
    [LimitOrderStatus.PARTIALLY_FILLED]: theme.warning,
  }

  const color = MapStatusColor[status]
  if (color) {
    return color
  }

  if (isNotSufficientFund) {
    return theme.warning
  }

  return undefined
}

const IndexText = ({ children }: { children?: React.ReactNode }) => (
  <div className="w-[18px] text-center font-medium text-subText">{children}</div>
)

const WarningText = ({ children }: { children: React.ReactNode }) => <span className="text-warning">{children}</span>

export default function OrderItem({
  order,
  index,
  onCancelOrder,
  onEditOrder,
  isOrderCancelling,
  tokenPrices,
  isLast,
  hasOrderCancelling,
}: {
  order: LimitOrder
  onCancelOrder: (order: LimitOrder) => void
  onEditOrder: (order: LimitOrder) => void
  index: number
  isOrderCancelling: (order: LimitOrder) => boolean
  tokenPrices: Record<string, number>
  isLast: boolean
  hasOrderCancelling: boolean
}) {
  const [expand, setExpand] = useState(false)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isCancelling = isOrderCancelling(order)
  const theme = useTheme()

  const {
    createdAt = Date.now(),
    expiredAt = Date.now(),
    takingAmount,
    filledTakingAmount,
    transactions = [],
    takerAssetSymbol,
    takerAssetDecimals,
    takerAsset,
    makerAsset,
    nativeOutput,
    chainId,
  } = order
  const native = NativeCurrencies[chainId]
  const isNative = nativeOutput && takerAssetSymbol.toLowerCase() === native?.wrapped.symbol?.toLowerCase()
  const takerSymbol = isNative ? native?.symbol || takerAssetSymbol : takerAssetSymbol

  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const isOrderActive = isActiveStatus(order.status)
  const filledPercent = calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals)

  const makingToken = useMemo(() => {
    return new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  }, [order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol])

  const makingTokenBalance = useTokenBalance(makingToken)
  const neededFund = getNeededMakingAmount(order)
  const isNotSufficientFund = makingTokenBalance ? makingTokenBalance.lessThan(neededFund) : false

  const colorStatus = getColorStatus(status, theme, isNotSufficientFund)
  const txHash = transactions[0]?.txHash ?? ''
  const toggle = () => setExpand(prev => !prev)

  const marketPrice = tokenPrices[order.takerAsset] / tokenPrices[order.makerAsset]
  const selectedPrice = Number(formatRateLimitOrder(order, false))
  const percent = ((marketPrice - selectedPrice) / marketPrice) * 100

  const navigate = useNavigate()
  const onClickOrder = () => {
    navigate({
      search: new URLSearchParams({
        inputCurrency: makerAsset,
        outputCurrency: takerAsset,
      }).toString(),
    })
  }

  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const i = setTimeout(() => {
      searchParams.delete('highlight')
      setSearchParams(searchParams)
    }, 5_000) // to ensure the searchParams is updated after the click

    return () => clearTimeout(i)
  }, [searchParams, setSearchParams])

  const renderProgressComponent = () => {
    const getTooltipText = () => {
      const texts = [<Trans key={0}>Insufficient {order.makerAssetSymbol} balance for order execution.</Trans>]

      if (Number.isFinite(percent) && percent < 0) {
        texts.push(<> </>)
        texts.push(
          <Trans key={1}>
            Once you add {order.makerAssetSymbol}, the order will be executed at{' '}
            <WarningText>{percent.toFixed(2)}%</WarningText> below the market price.
          </Trans>,
        )
      }

      return texts
    }

    return (
      <Colum>
        <div className="flex items-center gap-1" style={{ color: colorStatus }}>
          {isOrderActive && isNotSufficientFund && (
            <InfoHelper
              style={{
                marginLeft: 0,
              }}
              placement="top"
              color={colorStatus}
              text={getTooltipText()}
            />
          )}{' '}
          {formatStatusLimitOrder(order, isCancelling, isNotSufficientFund)}
        </div>
        <ProgressBar
          width={upToSmall ? '160px' : 'unset'}
          backgroundColor={theme.subText}
          color={colorStatus}
          height="11px"
          percent={isNaN(parseFloat(filledPercent)) ? 0 : parseFloat(filledPercent)}
        />
      </Colum>
    )
  }

  if (upToSmall) {
    return (
      <ItemWrapperMobile onClick={onClickOrder}>
        <div className="flex justify-between">
          <AmountInfo order={order} takerSymbol={takerSymbol} />
          <ActionButtons
            order={order}
            txHash={txHash}
            onExpand={toggle}
            expand={expand}
            onCancelOrder={onCancelOrder}
            onEditOrder={onEditOrder}
            isCancelling={isCancelling}
          />
        </div>
        <div className="flex justify-between">
          {renderProgressComponent()}
          <TradeRateOrder order={order} style={{ textAlign: 'right', cursor: 'default' }} symbolOut={takerSymbol} />
        </div>
        {expand && (
          <div>
            {transactions.map(txs => {
              return (
                <div key={txs.txHash} className="flex justify-between">
                  <SingleAmountInfo
                    decimals={takerAssetDecimals}
                    className="text-subText"
                    logoUrl={order.takerAssetLogoURL}
                    amount={txs.takingAmount}
                    symbol={takerSymbol}
                    hideLogo
                  />
                  <div className="flex items-center">
                    <TimeText time={txs.txTime} style={{ marginRight: '7px' }} />
                    <ActionButtons itemStyle={{ margin: 0 }} order={order} txHash={txHash} isChildren />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex justify-between">
          <Colum>
            <span>
              <Trans>Created</Trans>
            </span>
            <TimeText time={createdAt} />
          </Colum>
          <Colum>
            <span className="text-right">
              <Trans>Expiry</Trans>
            </span>
            <TimeText time={order.expiredAt} />
          </Colum>
        </div>
      </ItemWrapperMobile>
    )
  }

  const highlight =
    searchParams.get('highlight') === 'true' &&
    order.makerAsset.toLowerCase() === searchParams.get('search')?.toLowerCase() &&
    isOrderActive

  return (
    <>
      <ItemWrapper
        highlight={highlight}
        hasBorder={isLast ? false : !transactions.length || !expand}
        active={hasOrderCancelling}
        onClick={onClickOrder}
      >
        <div className="flex items-center gap-[10px]">
          <IndexText>{index + 1}</IndexText>
          <AmountInfo order={order} takerSymbol={takerSymbol} />
        </div>
        <Colum className="rate">
          <TradeRateOrder order={order} style={{ cursor: 'default' }} symbolOut={takerSymbol} />
        </Colum>
        <Colum>
          <TimeText time={createdAt} />
          <TimeText time={expiredAt} />
        </Colum>
        <Colum>{renderProgressComponent()}</Colum>
        <ActionButtons
          order={order}
          onExpand={toggle}
          expand={expand}
          txHash={txHash}
          onCancelOrder={onCancelOrder}
          onEditOrder={onEditOrder}
          isCancelling={isCancelling}
        />
      </ItemWrapper>
      {expand && (
        <div className="flex flex-col border-b border-border pb-[10px]">
          {transactions.map(txs => {
            const filledPercent = calcPercentFilledOrder(txs.takingAmount, takingAmount, takerAssetDecimals)
            return (
              <ItemWrapper key={txs.txHash} hasBorder={false} className="!py-0">
                <div className="flex items-center gap-[10px]">
                  <IndexText />
                  <div className="flex">
                    <div className="mr-2 w-[17px]" />
                    <DeltaAmount className="text-subText">
                      + {formatAmountOrder(txs.takingAmount, takerAssetDecimals)} {takerSymbol}
                    </DeltaAmount>
                  </div>
                </div>
                <Colum className="rate"></Colum>
                <Colum>
                  <TimeText time={txs.txTime} />
                </Colum>
                <Colum>
                  <span style={{ color: colorStatus }}>{filledPercent}%</span>
                </Colum>
                <ActionButtons order={order} txHash={txs.txHash} isChildren />
              </ItemWrapper>
            )
          })}
        </div>
      )}
    </>
  )
}
