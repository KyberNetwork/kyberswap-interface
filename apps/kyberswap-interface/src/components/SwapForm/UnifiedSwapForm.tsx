import { CurrencyAmount, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import type { ReactNode } from 'react'

import { CrossChainCurrencyPanel } from 'components/SwapForm/CrossChain/CrossChainCurrencyPanel'
import { useCrossChainBalance } from 'components/SwapForm/CrossChain/hooks/useCrossChainBalance'
import ERC8056Info, { useERC8056SwapInfo } from 'components/SwapForm/CurrencyInput/ERC8056Info'
import InputCurrencyPanel from 'components/SwapForm/CurrencyInput/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/CurrencyInput/OutputCurrencyPanel'
import { SwapFormLayout } from 'components/SwapForm/SwapFormLayout'
import { CrossChainEvmSenderWalletSelector } from 'components/SwapWallets/CrossChainEvmSenderWalletSelector'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { getERC8056DisplayAmount, useERC8056TypedInput } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import { WalletBalanceContext } from 'state/wallet/WalletBalanceContext'
import { useCurrencyBalance } from 'state/wallet/hooks'
import type { Chain, Currency, NonEvmChain, NonEvmCurrency } from 'types/crossChain'

const evmCurrency = (currency?: Currency) => (currency && 'isNative' in currency ? currency : undefined)

/** Shared input UI; rendering it does not require the quote/execution provider. */
export type SwapFormSelectionProps = {
  outputSelectorChain?: Chain
  hidden: boolean
  onChangeCurrencyIn: (currency: EvmCurrency) => void
  onChangeCurrencyOut: (currency: EvmCurrency) => void
  onSelectNonEvmCurrencyIn: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onSelectNonEvmCurrencyOut: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onReverse: (outputAmount?: string) => void
}

type Props = SwapFormSelectionProps & {
  amount: string
  onAmountChange: (value: string) => void
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  fromChainId: Chain
  toChainId: Chain
  parsedAmountIn?: CurrencyAmount<EvmCurrency>
  parsedAmountOut?: CurrencyAmount<EvmCurrency>
  outputAmount?: string
  amountInUsd?: string
  amountOutUsd?: string
  wrapType?: WrapType
  loading: boolean
  isInputCurrencyLoading?: boolean
  isOutputCurrencyLoading?: boolean
  receiver?: ReactNode
  receiverAddress?: string
  outputFooter?: ReactNode
  details: ReactNode
  action: ReactNode
}

export const UnifiedSwapForm = ({
  amount,
  onAmountChange,
  currencyIn,
  currencyOut,
  fromChainId,
  toChainId,
  parsedAmountIn,
  parsedAmountOut,
  outputAmount,
  outputSelectorChain,
  amountInUsd,
  amountOutUsd,
  wrapType = WrapType.NOT_APPLICABLE,
  loading,
  isInputCurrencyLoading,
  isOutputCurrencyLoading,
  receiver,
  receiverAddress,
  outputFooter,
  details,
  action,
  hidden,
  onChangeCurrencyIn,
  onChangeCurrencyOut,
  onSelectNonEvmCurrencyIn,
  onSelectNonEvmCurrencyOut,
  onReverse,
}: Props) => {
  const { chainId } = useActiveWeb3React()
  const wallets = useSwapWallets()
  const { trackingHandler } = useTracking()

  const independentWallets = wallets && (typeof fromChainId !== 'number' || typeof toChainId !== 'number')
  const input = evmCurrency(currencyIn)
  const output = evmCurrency(currencyOut)
  const independentEvmReceiver = typeof fromChainId !== 'number' && typeof toChainId === 'number'

  // EVM input is the app connection; SwapWalletProvider promotes the receiver
  // there on reverse. Independent output reads must instead use receiverAddress.
  const balanceIn = useCurrencyBalance(input, input?.chainId)
  const appBalanceOut = useCurrencyBalance(output, output?.chainId)
  const receiverBalance = useCrossChainBalance(toChainId, output, independentEvmReceiver ? receiverAddress : undefined)
  const balanceOut = independentEvmReceiver
    ? output && receiverBalance !== undefined
      ? CurrencyAmount.fromRawAmount(output, receiverBalance)
      : undefined
    : appBalanceOut

  const erc8056Info = useERC8056SwapInfo({ chainId, currencyIn: input, currencyOut: output, balanceIn, balanceOut })
  const { displayTypedValue, onDisplayInput, onRawValue } = useERC8056TypedInput(
    erc8056Info.inputInfo,
    amount,
    onAmountChange,
  )

  const displayAmountOut = getERC8056DisplayAmount(erc8056Info.outputInfo, parsedAmountOut)

  const selectEvmCurrency = (currency: EvmCurrency, side: 'input' | 'output') => {
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SELECTED, {
      token_symbol: currency.symbol,
      token_address: currency.isNative ? 'NATIVE' : currency.wrapped.address,
      token_position: side,
      paired_token: side === 'input' ? currencyOut?.symbol : currencyIn?.symbol,
      chain: NETWORKS_INFO[currency.chainId].name,
    })
    if (side === 'input') onChangeCurrencyIn(currency)
    else onChangeCurrencyOut(currency)
  }

  const handleReverse = () => {
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_PAIR_REVERSED, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      new_from_token: currencyOut?.symbol,
      new_to_token: currencyIn?.symbol,
      chain: typeof fromChainId === 'number' ? NETWORKS_INFO[fromChainId].name : fromChainId,
    })
    // Reverse supplies a raw amount; discard text owned by the previous input token first.
    onRawValue(outputAmount ?? amount)
    onReverse()
  }

  return (
    <SwapFormLayout
      hidden={hidden}
      onReverse={handleReverse}
      inputPanel={
        <WalletBalanceContext.Provider
          value={independentWallets ? { chain: fromChainId, address: wallets.inputAddress } : undefined}
        >
          {typeof fromChainId !== 'number' ? (
            <CrossChainCurrencyPanel
              chain={fromChainId}
              currency={currencyIn}
              currencyLoading={isInputCurrencyLoading}
              value={amount}
              amountUsd={amountInUsd ? Number(amountInUsd) : undefined}
              onUserInput={onAmountChange}
              onCurrencySelect={onChangeCurrencyIn}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyIn}
            />
          ) : (
            <InputCurrencyPanel
              walletSelector={
                typeof toChainId !== 'number' ? (
                  <div className="-my-1 -ml-2 flex">
                    <CrossChainEvmSenderWalletSelector chain={fromChainId} />
                  </div>
                ) : undefined
              }
              amountInUsd={amountInUsd}
              wrapType={wrapType}
              typedValue={displayTypedValue}
              rawTypedValue={amount}
              onRawAmountChange={onRawValue}
              onUserInput={onDisplayInput}
              currencyIn={input}
              currencyLoading={isInputCurrencyLoading}
              currencyOut={output}
              balanceIn={balanceIn}
              balanceText={erc8056Info.input.balanceText}
              highlightToken={erc8056Info.input.isScaled}
              onChangeCurrencyIn={currency => selectEvmCurrency(currency, 'input')}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyIn}
              customChainId={fromChainId}
              chainSelectionMode="form"
            />
          )}
        </WalletBalanceContext.Provider>
      }
      outputPanel={
        <WalletBalanceContext.Provider
          value={independentWallets ? { chain: toChainId, address: receiverAddress || '' } : undefined}
        >
          {toChainId && typeof toChainId !== 'number' ? (
            <CrossChainCurrencyPanel
              output
              selectorChain={outputSelectorChain}
              receiver={receiver}
              receiverAddress={receiverAddress}
              loading={loading}
              chain={toChainId}
              currency={currencyOut}
              currencyLoading={isOutputCurrencyLoading}
              value={outputAmount || ''}
              amountUsd={amountOutUsd ? Number(amountOutUsd) : undefined}
              onCurrencySelect={onChangeCurrencyOut}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyOut}
            />
          ) : (
            <OutputCurrencyPanel
              selectorChain={outputSelectorChain}
              footer={outputFooter}
              label={receiver}
              wrapType={wrapType}
              parsedAmountIn={parsedAmountIn}
              parsedAmountOut={displayAmountOut}
              currencyIn={input}
              currencyOut={output}
              currencyLoading={isOutputCurrencyLoading}
              amountOutUsd={amountOutUsd}
              balanceText={
                erc8056Info.output.balanceText ??
                (independentEvmReceiver ? balanceOut?.toSignificant(10) ?? '--' : undefined)
              }
              balanceActionsEnabled={independentEvmReceiver ? !!(receiverAddress && output) : undefined}
              highlightToken={erc8056Info.output.isScaled}
              onChangeCurrencyOut={currency => selectEvmCurrency(currency, 'output')}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyOut}
              customChainId={toChainId}
              chainSelectionMode="form"
              routeLoading={loading}
            />
          )}
        </WalletBalanceContext.Provider>
      }
      tokenInfo={<ERC8056Info tokens={erc8056Info.tokens} />}
      details={details}
      action={action}
    />
  )
}
