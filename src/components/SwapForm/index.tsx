import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo } from 'react'
import { Flex } from 'rebass'

import AddressInputPanel from 'components/AddressInputPanel'
import { AutoRow } from 'components/Row'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { Wrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { useToggleTransactionSettingsMenu } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { tryParseAmount } from 'state/swap/hooks'

import ActionButton from './ActionButton'
import InputCurrencyPanel from './InputCurrencyPanel'
import OutputCurrencyPanel from './OutputCurrencyPanel'
import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import TradePrice from './TradePrice'
import TradeSummary from './TradeSummary'
import useResetInputFieldInSolanaUnwrap from './useResetInputFieldInSolanaUnwrap'

export type SwapFormProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  typedValue: string
  isAdvancedMode: boolean
  allowedSlippage: number
  recipient: string | null

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
  typedValue,
  isAdvancedMode,
  allowedSlippage,
  recipient,

  onReverseTokenSelection,
  onUserInput,
  onCurrencySelection,
  onResetSelectCurrency,
  onChangeRecipient,
}) => {
  const { chainId, isSolana, isEVM } = useActiveWeb3React()
  const theme = useTheme()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()

  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, currencyIn || undefined)
  }, [typedValue, currencyIn])

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  useResetInputFieldInSolanaUnwrap(isSolana, wrapType, balanceIn, onUserInput)

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isAdvancedMode])

  return (
    <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
      <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
        <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
          <InputCurrencyPanel />

          <AutoRow justify="space-between">
            <Flex alignItems="center">
              {!showWrap && (
                <>
                  <RefreshButton />
                  <TradePrice />
                </>
              )}
            </Flex>

            <ReverseTokenSelectionButton onClick={onReverseTokenSelection} />
          </AutoRow>

          <OutputCurrencyPanel />

          {isAdvancedMode && isEVM && !showWrap && (
            <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
          )}

          {!showWrap && (
            <Flex alignItems="center" fontSize={12} color={theme.subText} onClick={toggleSettings} width="fit-content">
              <ClickableText color={theme.subText} fontWeight={500}>
                <Trans>Max Slippage:</Trans>&nbsp;
                {allowedSlippage / 100}%
              </ClickableText>
            </Flex>
          )}
        </Flex>

        <TradeTypeSelection />

        {chainId !== ChainId.ETHW && (
          <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} style={{ marginTop: '24px' }} />
        )}

        <PriceImpactNote />

        <ActionButton />
      </Wrapper>
      <TradeSummary />
    </Flex>
  )
}

export default SwapForm
