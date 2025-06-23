import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { APP_PATHS } from 'constants/index'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, usePermitData, useSwapActionHandlers } from 'state/swap/hooks'
import { useDegenModeManager, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { DetailedRouteSummary } from 'types/route'

type Props = {
  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>
  hidden: boolean
  onOpenGasToken: () => void
}
const PopulatedSwapForm: React.FC<Props> = ({ routeSummary, setRouteSummary, hidden, onOpenGasToken }) => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )
  const [ttl] = useUserTransactionTTL()
  const [isDegenMode] = useDegenModeManager()
  const [slippage] = useUserSlippageTolerance()
  const permitData = usePermitData(currencyIn?.wrapped.address)

  const { onCurrencySelection } = useSwapActionHandlers()

  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isPartnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)

  const outId =
    searchParams.get('outputCurrency') || (currencyOut?.isNative ? currencyOut.symbol : currencyOut?.wrapped.address)
  const inId =
    searchParams.get('inputCurrency') || (currencyIn?.isNative ? currencyIn.symbol : currencyIn?.wrapped.address)

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      if (isPartnerSwap) {
        const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
        if (value === outId) searchParams.set('outputCurrency', inId || '')
        searchParams.set('inputCurrency', value)
        setSearchParams(searchParams)
      } else onCurrencySelection(Field.INPUT, c)
    },
    [searchParams, setSearchParams, isPartnerSwap, onCurrencySelection, inId, outId],
  )

  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      if (isPartnerSwap) {
        const value = c.isNative ? c.symbol || c.wrapped.address : c.wrapped.address
        if (value === inId) searchParams.set('inputCurrency', outId || '')
        searchParams.set('outputCurrency', value)
        setSearchParams(searchParams)
      } else onCurrencySelection(Field.OUTPUT, c)
    },
    [searchParams, setSearchParams, isPartnerSwap, onCurrencySelection, inId, outId],
  )

  const props: SwapFormProps = {
    hidden,
    routeSummary,
    setRouteSummary,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isDegenMode,
    slippage,
    transactionTimeout: ttl,
    permit: permitData?.rawSignature,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    onOpenGasToken,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
