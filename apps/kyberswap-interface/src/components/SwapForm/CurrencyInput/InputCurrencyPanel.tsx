import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import type { ReactNode } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useBalanceAmountShortcuts } from 'components/CurrencyInputPanel/useBalanceAmountShortcuts'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import type { NonEvmChain, NonEvmCurrency } from 'types/crossChain'
import { getGasReservation } from 'utils/gasReserve'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  walletSelector?: ReactNode
  amountInUsd?: string
  wrapType: WrapType
  typedValue: string
  rawTypedValue: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceText?: string
  highlightToken?: boolean
  currencyLoading?: boolean
  onChangeCurrencyIn: (c: Currency) => void
  onRawAmountChange: (v: string) => void
  onUserInput: (v: string) => void
  chainSelectionMode?: 'wallet' | 'form'
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  customChainId?: ChainId
}
/** Adapts form input/balance actions to the shared field. Token loading is supplied by the pair resolver. */
const InputCurrencyPanel = ({
  walletSelector,
  amountInUsd,
  wrapType,
  typedValue,
  rawTypedValue,
  onRawAmountChange,
  onUserInput,
  currencyIn,
  currencyOut,
  balanceIn,
  balanceText,
  highlightToken,
  currencyLoading,
  onChangeCurrencyIn,
  customChainId,
  chainSelectionMode,
  onSelectNonEvmCurrency,
}: Props) => {
  const { account, networkInfo } = useActiveWeb3React()
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
    onRawAmountChange(max || '')
  }

  const amountShortcuts = useBalanceAmountShortcuts(
    balanceIn,
    rawTypedValue,
    onRawAmountChange,
    'swap-amount',
    !!walletSelector,
  )

  return (
    <CurrencyInputPanel
      label={walletSelector}
      positionLabel="in"
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={onUserInput}
      onMax={handleMaxInput}
      amountShortcuts={amountShortcuts.map((shortcut, index) =>
        index === amountShortcuts.length - 1 ? { ...shortcut, onClick: handleMaxInput } : shortcut,
      )}
      balanceActionsEnabled={!!(account && currencyIn && balanceIn)}
      onCurrencySelect={onChangeCurrencyIn}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      dataTestId="swap-currency-input"
      showPinnedTokens={true}
      customBalanceText={balanceText}
      currencyLoading={currencyLoading}
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
