import { ChainId, Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { PropsWithChildren, ReactNode, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { DeltaRateLimitOrder, LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { subscribeNotificationOrderExpired } from 'utils/firebase'

const AprHighlight = ({ children }: PropsWithChildren) => <span className="font-medium text-apr">{children}</span>

const WarningHighlight = ({ children }: PropsWithChildren) => (
  <span className="font-medium text-warning">{children}</span>
)

const ReservedBalanceNotice = ({ tokenIn, tokenOut, to }: { tokenIn?: string; tokenOut?: string; to: string }) => (
  <span className="text-xs font-medium italic text-subText">
    <Trans>
      Your {tokenIn} balance is fully used by existing {tokenIn}/{tokenOut} orders. Cancel or reduce an order to free up
      balance. <Link to={to}>Review orders</Link>
    </Trans>
  </span>
)

export const WORSE_PRICE_DIFF_THRESHOLD = -5
export const BETTER_PRICE_DIFF_THRESHOLD = 30

type UseWarningCreateOrderProps = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  deltaRate: DeltaRateLimitOrder
  parsedInputAmount?: CurrencyAmount<Currency>
}

export type CreateOrderWarning = {
  type: 'info' | 'warn'
  message: ReactNode
}

export const useWarningCreateOrder = ({
  chainId,
  currencyIn,
  currencyOut,
  deltaRate,
  parsedInputAmount,
}: UseWarningCreateOrderProps) => {
  const { account } = useActiveWeb3React()

  const makingCurrency = useMemo(() => {
    if (!currencyIn) return undefined
    return currencyIn.isNative ? WETH[chainId] : currencyIn.wrapped
  }, [chainId, currencyIn])

  const inputBalance = useCurrencyBalance(currencyIn?.isNative ? undefined : currencyIn, chainId)
  const wrappedNativeBalance = useCurrencyBalance(currencyIn?.isNative ? makingCurrency : undefined, chainId)

  const { data: pairActiveOrderMakingAmount = '', refetch: getPairActiveMakingAmount } =
    useGetTotalActiveMakingAmountQuery(
      {
        chainId,
        makerAsset: currencyIn?.wrapped.address,
        takerAsset: currencyOut?.wrapped.address,
        account,
      },
      { skip: !currencyIn || !currencyOut || !account },
    )

  const parsedPairActiveOrderMakingAmount = useMemo(() => {
    try {
      if (makingCurrency && pairActiveOrderMakingAmount) {
        return TokenAmount.fromRawAmount(makingCurrency, JSBI.BigInt(pairActiveOrderMakingAmount))
      }
    } catch (error) {}
    return undefined
  }, [makingCurrency, pairActiveOrderMakingAmount])

  const showReservedOrderNotice = useMemo(() => {
    if (!currencyIn || !parsedInputAmount || !parsedPairActiveOrderMakingAmount) return false
    const reservedBalance = currencyIn.isNative ? wrappedNativeBalance : inputBalance
    if (!reservedBalance?.currency.equals(parsedPairActiveOrderMakingAmount.currency)) return false
    if (JSBI.equal(parsedPairActiveOrderMakingAmount.quotient, JSBI.BigInt(0))) return false

    const remainingBalance = currencyIn.isNative
      ? reservedBalance.quotient
      : JSBI.subtract(reservedBalance.quotient, parsedInputAmount.quotient)
    return JSBI.lessThan(remainingBalance, parsedPairActiveOrderMakingAmount.quotient)
  }, [currencyIn, inputBalance, parsedInputAmount, parsedPairActiveOrderMakingAmount, wrappedNativeBalance])

  useEffect(() => {
    if (!account || !currencyIn || !currencyOut) return
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, () => {
      try {
        getPairActiveMakingAmount()
      } catch (error) {}
    })
    return () => {
      unsubscribeExpired?.()
    }
  }, [account, chainId, currencyIn, currencyOut, getPairActiveMakingAmount])

  const warning = useMemo(() => {
    const warnings: CreateOrderWarning[] = []
    let shouldWarningAction = false
    let shouldDisableAction = false

    const rawPercent = Number(deltaRate.rawPercent)
    const hasPercent = Number.isFinite(rawPercent)
    const displayPercent = deltaRate.percent.replace(/^[+-]/, '')

    const addWarning = (message: ReactNode, options?: { type?: CreateOrderWarning['type'] }) => {
      warnings.push({ type: options?.type || 'warn', message })
    }

    if (hasPercent && rawPercent >= BETTER_PRICE_DIFF_THRESHOLD) {
      addWarning(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <AprHighlight>{displayPercent}</AprHighlight> higher than the market. We just want to
            make sure this is correct.
          </Trans>
        </div>,
        { type: 'info' },
      )
    }

    if (hasPercent && rawPercent <= WORSE_PRICE_DIFF_THRESHOLD && rawPercent > -100) {
      shouldWarningAction = true
      addWarning(
        <div className="text-xs font-medium italic text-subText">
          <Trans>
            Limit order price is <WarningHighlight>{displayPercent}</WarningHighlight> lower than the market. You will
            be selling your {currencyIn?.symbol} exceedingly cheap.
          </Trans>
        </div>,
        { type: 'warn' },
      )
    }

    if (showReservedOrderNotice) {
      shouldDisableAction = true
      const makerAssetSymbol = currencyIn?.wrapped.symbol
      const takerAssetSymbol = currencyOut?.wrapped.symbol
      const search = new URLSearchParams({
        tab: LimitOrderTab.MY_ORDER,
        orderTab: LimitOrderStatus.ACTIVE,
        search: `${makerAssetSymbol}/${takerAssetSymbol}`,
      }).toString()

      addWarning(<ReservedBalanceNotice tokenIn={makerAssetSymbol} tokenOut={takerAssetSymbol} to={`?${search}`} />, {
        type: 'warn',
      })
    }

    return {
      shouldWarningAction,
      shouldDisableAction,
      warnings,
    }
  }, [currencyIn, currencyOut, deltaRate.percent, deltaRate.rawPercent, showReservedOrderNotice])
  return warning
}
