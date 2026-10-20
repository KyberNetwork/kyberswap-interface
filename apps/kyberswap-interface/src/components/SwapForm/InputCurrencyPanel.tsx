import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import type { NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { getGasReservation } from 'utils/gasReserve'
import { halfAmountSpend } from 'utils/maxAmountSpend'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  amountInUsd?: string
  wrapType: WrapType
  typedValue: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceText?: string
  highlightToken?: boolean
  onChangeCurrencyIn: (c: Currency) => void
  setTypedValue: (v: string) => void
  onUserInput: (v: string) => void
  chainSelectionMode?: 'wallet' | 'form'
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  customChainId?: ChainId
}
const InputCurrencyPanel: React.FC<Props> = ({
  amountInUsd,
  wrapType,
  typedValue,
  setTypedValue,
  onUserInput,
  currencyIn,
  currencyOut,
  balanceIn,
  balanceText,
  highlightToken,
  onChangeCurrencyIn,
  customChainId,
  chainSelectionMode,
  onSelectNonEvmCurrency,
}) => {
  const { networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const inputUsd = showWrap ? undefined : amountInUsd

  const handleMaxInput = () => {
    const gasReservation = getGasReservation(balanceIn)
    const max = (gasReservation?.maxAmount ?? balanceIn)?.toExact()
    trackingHandler(TRACKING_EVENT_TYPE.MAX_BALANCE_CLICKED, {
      token_symbol: currencyIn?.symbol,
      token_address: currencyIn?.isNative ? 'NATIVE' : currencyIn?.wrapped?.address,
      max_balance: max,
      max_balance_usd: inputUsd,
      chain: networkInfo.name,
    })
    setTypedValue(max || '')
  }

  const handleHalfInput = () => {
    const half = halfAmountSpend(balanceIn)?.toExact()
    setTypedValue(half || '')
  }

  return (
    <CurrencyInputPanel
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={onUserInput}
      onMax={handleMaxInput}
      onHalf={handleHalfInput}
      onCurrencySelect={onChangeCurrencyIn}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      dataTestId="swap-currency-input"
      showPinnedTokens={true}
      customBalanceText={balanceText}
      highlightCurrencySelect={highlightToken}
      estimatedUsd={inputUsd ? formatDisplayNumber(inputUsd, { style: 'currency', significantDigits: 4 }) : undefined}
      customChainId={customChainId}
      chainSelectionMode={chainSelectionMode}
      onSelectNonEvmCurrency={onSelectNonEvmCurrency}
      trackingSource="swap"
      scaleERC8056Balances
    />
  )
}

export default InputCurrencyPanel
