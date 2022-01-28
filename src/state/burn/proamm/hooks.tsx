import React from 'react'
import { Currency, CurrencyAmount, Percent } from '@vutien/sdk-core'
import { BigNumber } from '@ethersproject/bignumber'
import { ReactNode, useCallback, useMemo } from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { Field } from '../actions'
import { AppState } from 'state'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { selectPercent } from './actions'
import { PositionDetails } from 'types/position'
import { Position } from '@vutien/dmm-v3-sdk'
import { useToken } from 'hooks/Tokens'
import { useActiveWeb3React } from 'hooks'
import { usePool } from 'hooks/usePools'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { Trans } from '@lingui/macro'

export function useBurnProAmmState(): AppState['burnProAmm'] {
  return useAppSelector(state => state.burnProAmm)
}

export function useDerivedProAmmBurnInfo(
  position?: PositionDetails,
  asWETH = false
): {
  position?: Position
  liquidityPercentage?: Percent
  liquidityValue0?: CurrencyAmount<Currency>
  liquidityValue1?: CurrencyAmount<Currency>
  feeValue0?: CurrencyAmount<Currency>
  feeValue1?: CurrencyAmount<Currency>
  outOfRange: boolean
  error?: ReactNode
} {
  const { account } = useActiveWeb3React()
  const { percent } = useBurnProAmmState()

  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)
  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.fee)
  const positionSDK = useMemo(
    () =>
      pool && position?.liquidity && typeof position?.tickLower === 'number' && typeof position?.tickUpper === 'number'
        ? new Position({
            pool,
            liquidity: position.liquidity.toString(),
            tickLower: position.tickLower,
            tickUpper: position.tickUpper
          })
        : undefined,
    [pool, position]
  )

  const liquidityPercentage = new Percent(percent, 100)

  const discountedAmount0 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount0.quotient).quotient
    : undefined
  const discountedAmount1 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount1.quotient).quotient
    : undefined

  const liquidityValue0 =
    token0 && discountedAmount0
      ? CurrencyAmount.fromRawAmount(asWETH ? token0 : unwrappedToken(token0), discountedAmount0)
      : undefined
  const liquidityValue1 =
    token1 && discountedAmount1
      ? CurrencyAmount.fromRawAmount(asWETH ? token1 : unwrappedToken(token1), discountedAmount1)
      : undefined

  const outOfRange =
    pool && position ? pool.tickCurrent < position.tickLower || pool.tickCurrent > position.tickUpper : false
  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (percent === 0) {
    error = error ?? <Trans>Enter a percent</Trans>
  }
  return {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0: undefined,
    feeValue1: undefined,
    outOfRange,
    error
  }
}
export function useBurnProAmmActionHandlers(): {
  onPercentSelect: (percent: number) => void
} {
  const dispatch = useAppDispatch()

  const onPercentSelect = useCallback(
    (percent: number) => {
      dispatch(selectPercent({ percent }))
    },
    [dispatch]
  )

  return {
    onPercentSelect
  }
}
