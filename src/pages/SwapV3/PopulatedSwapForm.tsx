import { Currency } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

const useUpdateSlippageInStableCoinSwap = (currencyIn?: Currency, currencyOut?: Currency) => {
  const { chainId } = useActiveWeb3React()
  const [slippage, setSlippage] = useUserSlippageTolerance()
  const isStableCoinSwap =
    chainId &&
    currencyIn &&
    currencyOut &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyIn.wrapped.address) &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyOut.wrapped.address)
  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage
  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setSlippage(50)
    }
  }, [isStableCoinSwap, setSlippage])
}

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const [isAdvancedMode] = useExpertModeManager()
  const [allowedSlippage] = useUserSlippageTolerance()

  const { recipient, typedValue } = useSwapState()
  const { onSwitchTokensV2, onUserInput, onCurrencySelection, onChangeRecipient, onResetSelectCurrency } =
    useSwapActionHandlers()

  useUpdateSlippageInStableCoinSwap()

  const props: SwapFormProps = {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    typedValue,
    isAdvancedMode,
    allowedSlippage,
    recipient,

    onReverseTokenSelection: onSwitchTokensV2,
    onUserInput,
    onCurrencySelection,
    onResetSelectCurrency,
    onChangeRecipient,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
