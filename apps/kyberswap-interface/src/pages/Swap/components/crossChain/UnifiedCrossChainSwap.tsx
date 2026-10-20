import { CurrencyAmount, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { memo, useEffect, useState } from 'react'

import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import ERC8056Info, { useERC8056SwapInfo } from 'components/SwapForm/ERC8056Info'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import { SwapFormLayout } from 'components/SwapForm/SwapFormLayout'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { getERC8056DisplayAmount, useERC8056TypedInput } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import { Currency, NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { CrossChainQuoteDetails } from 'pages/Swap/components/crossChain/CrossChainQuoteDetails'
import { CrossChainRecipient } from 'pages/Swap/components/crossChain/CrossChainRecipient'
import { PiWarning } from 'pages/Swap/components/crossChain/PiWarning'
import { SwapAction } from 'pages/Swap/components/crossChain/SwapAction'
import { UnifiedNonEvmPanel } from 'pages/Swap/components/crossChain/UnifiedNonEvmPanel'
import {
  CrossChainSwapOptions,
  CrossChainSwapProvider,
  useCrossChainSwap,
} from 'pages/Swap/hooks/crossChain/useCrossChainSwap'
import { useCurrencyBalance } from 'state/wallet/hooks'

const evmCurrency = (currency?: Currency) => (currency && 'isNative' in currency ? currency : undefined)

type FormProps = {
  hidden: boolean
  onChangeCurrencyIn: (currency: EvmCurrency) => void
  onChangeCurrencyOut: (currency: EvmCurrency) => void
  onSelectNonEvmCurrencyIn: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onSelectNonEvmCurrencyOut: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onReverse: () => void
}

const UnifiedCrossChainContent = ({
  hidden,
  onChangeCurrencyIn,
  onChangeCurrencyOut,
  onSelectNonEvmCurrencyIn,
  onSelectNonEvmCurrencyOut,
  onReverse,
}: FormProps) => {
  const { amount, setAmount, currencyIn, currencyOut, fromChainId, toChainId, selectedQuote, loading, warning } =
    useCrossChainSwap()
  const { chainId } = useActiveWeb3React()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const input = evmCurrency(currencyIn)
  const output = evmCurrency(currencyOut)
  const balanceIn = useCurrencyBalance(input, input?.chainId)
  const balanceOut = useCurrencyBalance(output, output?.chainId)
  const erc8056Info = useERC8056SwapInfo({ chainId, currencyIn: input, currencyOut: output, balanceIn, balanceOut })
  const { displayTypedValue, onDisplayInput, onRawValue } = useERC8056TypedInput(
    erc8056Info.inputInfo,
    amount,
    setAmount,
  )
  const { message } = useHoneypotWarning({
    chainId: output?.chainId,
    tokenAddress: output?.wrapped.address,
    tokenSymbol: output?.symbol,
  })

  const { trackingHandler } = useTracking()
  const debouncedAmount = useDebounce(amount, 1000)
  useEffect(() => {
    if (debouncedAmount && Number(debouncedAmount) > 0 && input) {
      trackingHandler(TRACKING_EVENT_TYPE.AMOUNT_ENTERED, {
        token_symbol: input.symbol,
        token_address: input.isNative ? 'NATIVE' : input.wrapped.address,
        amount: debouncedAmount,
        token_position: 'input',
        paired_token: currencyOut?.symbol,
        chain: NETWORKS_INFO[input.chainId].name,
      })
    }
    // Amount tracking follows user edits, not quote refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount])
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

  const quote = selectedQuote?.quote
  const parsedAmountOut =
    output && quote ? CurrencyAmount.fromRawAmount(output, quote.outputAmount.toString()) : undefined
  const displayAmountOut = getERC8056DisplayAmount(erc8056Info.outputInfo, parsedAmountOut)

  return (
    <>
      <SwapFormLayout
        hidden={hidden}
        onReverse={() => {
          trackingHandler(TRACKING_EVENT_TYPE.TOKEN_PAIR_REVERSED, {
            from_token: currencyIn?.symbol,
            to_token: currencyOut?.symbol,
            new_from_token: currencyOut?.symbol,
            new_to_token: currencyIn?.symbol,
            chain: typeof fromChainId === 'number' ? NETWORKS_INFO[fromChainId].name : fromChainId,
          })
          onReverse()
          if (quote) setAmount(quote.formattedOutputAmount)
        }}
        inputPanel={
          typeof fromChainId !== 'number' ? (
            <UnifiedNonEvmPanel
              chain={fromChainId}
              currency={currencyIn}
              value={amount}
              amountUsd={quote?.inputUsd}
              onUserInput={setAmount}
              onCurrencySelect={onChangeCurrencyIn}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyIn}
            />
          ) : (
            <InputCurrencyPanel
              amountInUsd={quote?.inputUsd?.toString()}
              wrapType={WrapType.NOT_APPLICABLE}
              typedValue={displayTypedValue}
              setTypedValue={onRawValue}
              onUserInput={onDisplayInput}
              currencyIn={input}
              currencyOut={output}
              balanceIn={balanceIn}
              balanceText={erc8056Info.input.balanceText}
              highlightToken={erc8056Info.input.isScaled}
              onChangeCurrencyIn={currency => selectEvmCurrency(currency, 'input')}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyIn}
              customChainId={fromChainId}
              chainSelectionMode="form"
            />
          )
        }
        outputPanel={
          toChainId && typeof toChainId !== 'number' ? (
            <UnifiedNonEvmPanel
              output
              loading={loading}
              chain={toChainId}
              currency={currencyOut}
              value={quote?.formattedOutputAmount || ''}
              amountUsd={quote?.outputUsd}
              onCurrencySelect={onChangeCurrencyOut}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyOut}
            />
          ) : (
            <OutputCurrencyPanel
              wrapType={WrapType.NOT_APPLICABLE}
              parsedAmountIn={undefined}
              parsedAmountOut={displayAmountOut}
              currencyIn={input}
              currencyOut={output}
              amountOutUsd={quote?.outputUsd?.toString()}
              balanceText={erc8056Info.output.balanceText}
              highlightToken={erc8056Info.output.isScaled}
              onChangeCurrencyOut={currency => selectEvmCurrency(currency, 'output')}
              onSelectNonEvmCurrency={onSelectNonEvmCurrencyOut}
              customChainId={toChainId}
              chainSelectionMode="form"
              routeLoading={loading}
            />
          )
        }
        tokenInfo={<ERC8056Info tokens={erc8056Info.tokens} />}
        recipient={<CrossChainRecipient />}
        details={
          <Stack className="gap-2">
            <CrossChainQuoteDetails />
            <HoneypotWarning message={message} />
            <PiWarning warning={warning} />
          </Stack>
        }
        action={<SwapAction setShowBtcModal={setShowBitcoin} />}
      />
      <BitcoinConnectModal isOpen={showBitcoin} onDismiss={() => setShowBitcoin(false)} />
    </>
  )
}

type Props = CrossChainSwapOptions & FormProps

const UnifiedCrossChainSwap = (props: Props) => {
  return (
    <CrossChainSwapProvider
      amount={props.amount}
      onAmountChange={props.onAmountChange}
      fromChain={props.fromChain}
      toChain={props.toChain}
      tokenIn={props.tokenIn}
      tokenOut={props.tokenOut}
    >
      <UnifiedCrossChainContent {...props} />
    </CrossChainSwapProvider>
  )
}

export default memo(UnifiedCrossChainSwap)
