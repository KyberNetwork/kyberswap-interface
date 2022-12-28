import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex } from 'rebass'

import AddressInputPanel from 'components/AddressInputPanel'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoRow } from 'components/Row'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { Wrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { Field } from 'state/swap/actions'
import { tryParseAmount } from 'state/swap/hooks'
import { FeeConfig } from 'types/metaAggregator'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

import ActionButton from './ActionButton'
import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import TradePrice from './TradePrice'
import TradeSummary from './TradeSummary'
import TradeTypeSelection from './TradeTypeSelection'
import useResetInputFieldInSolanaUnwrap from './useResetInputFieldInSolanaUnwrap'

export type SwapFormProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  amountInUsd: string | undefined
  amountOutUsd: string | undefined
  typedValue: string
  isAdvancedMode: boolean
  slippage: number
  recipient: string | null
  priceImpact: number | undefined
  feeConfig: FeeConfig | undefined
  gasUsd: string | undefined

  onReverseTokenSelection: () => void
  onUserInput: (field: Field, value: string) => void
  onCurrencySelection: (field: Field, currency: Currency) => void
  onResetSelectCurrency: (field: Field) => void
  onChangeRecipient: (recipient: string | null) => void
}
const SwapForm: React.FC<SwapFormProps> = ({
  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,
  parsedAmountOut,
  amountInUsd,
  amountOutUsd,
  typedValue,
  isAdvancedMode,
  slippage,
  recipient,
  priceImpact,
  feeConfig,
  gasUsd,

  onReverseTokenSelection,
  onUserInput,
  onCurrencySelection,
  onResetSelectCurrency,
  onChangeRecipient,
}) => {
  const { chainId, isSolana, isEVM } = useActiveWeb3React()
  const theme = useTheme()
  const [saveGas, setSaveGas] = useState(false)

  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, currencyIn || undefined)
  }, [typedValue, currencyIn])

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const isWrapOrUnwrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP

  const getDisplayAmountOut = () => {
    if (isWrapOrUnwrap) {
      return parsedAmount?.toExact() || ''
    }
    return parsedAmountOut?.toSignificant(6) || ''
  }

  const handleMaxAmountInput = () => {
    const max = maxAmountSpend(balanceIn)?.toExact()
    onUserInput(Field.INPUT, max || '')
  }

  const handleHalfAmountInput = () => {
    const half = halfAmountSpend(balanceIn)?.toExact()
    onUserInput(Field.INPUT, half || '')
  }

  const handleClickSlippage = () => {
    console.log('TODO')
  }

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isAdvancedMode])

  useResetInputFieldInSolanaUnwrap(isSolana, wrapType, balanceIn, onUserInput)

  return (
    <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
      <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
        <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
          <CurrencyInputPanel
            value={typedValue}
            positionMax="top"
            currency={currencyIn}
            onUserInput={(value: string) => {
              onUserInput(Field.INPUT, value)
            }}
            onMax={isSolanaUnwrap ? null : handleMaxAmountInput}
            onHalf={isSolanaUnwrap ? null : handleHalfAmountInput}
            onCurrencySelect={(c: Currency) => {
              onCurrencySelection(Field.INPUT, c)
            }}
            otherCurrency={currencyOut}
            id="swap-currency-input"
            showCommonBases={true}
            estimatedUsd={amountInUsd && !isWrapOrUnwrap ? String(formattedNum(amountInUsd, true)) : undefined}
          />

          <AutoRow justify="space-between">
            <Flex alignItems="center">
              {!isWrapOrUnwrap && (
                <>
                  <RefreshButton />
                  <TradePrice />
                </>
              )}
            </Flex>

            <ReverseTokenSelectionButton onClick={onReverseTokenSelection} />
          </AutoRow>

          <CurrencyInputPanel
            disabledInput
            value={getDisplayAmountOut()}
            onMax={null}
            onHalf={null}
            currency={currencyOut}
            onCurrencySelect={(c: Currency) => {
              onCurrencySelection(Field.OUTPUT, c)
            }}
            otherCurrency={currencyIn}
            id="swap-currency-output"
            showCommonBases
            estimatedUsd={amountOutUsd && !isWrapOrUnwrap ? String(formattedNum(amountOutUsd, true)) : undefined}
          />

          {isAdvancedMode && isEVM && !isWrapOrUnwrap && (
            <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
          )}

          {!isWrapOrUnwrap && (
            <Flex
              alignItems="center"
              fontSize={12}
              color={theme.subText}
              onClick={handleClickSlippage}
              width="fit-content"
            >
              <ClickableText color={theme.subText} fontWeight={500}>
                <Trans>Max Slippage:</Trans>&nbsp;
                {slippage / 100}%
              </ClickableText>
            </Flex>
          )}
        </Flex>

        <TradeTypeSelection saveGas={saveGas} chooseToSaveGas={setSaveGas} />

        {chainId !== ChainId.ETHW && (
          <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} style={{ marginTop: '24px' }} />
        )}

        <PriceImpactNote priceImpact={priceImpact} isAdvancedMode={isAdvancedMode} />

        <ActionButton />
      </Wrapper>
      <TradeSummary
        feeConfig={feeConfig}
        slippage={slippage}
        amountInUsd={amountInUsd}
        parsedAmountOut={parsedAmountOut}
        priceImpact={priceImpact}
        gasUsd={gasUsd}
      />
    </Flex>
  )
}

export default SwapForm
