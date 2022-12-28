import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Flex } from 'rebass'

import AddressInputPanel from 'components/AddressInputPanel'
import { AutoRow } from 'components/Row'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { Wrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import usePrevious from 'hooks/usePrevious'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { AppState } from 'state'
import { useToggleTransactionSettingsMenu } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { useUserAddedTokens } from 'state/user/hooks'

import ActionButton from './ActionButton'
import InputCurrencyPanel from './InputCurrencyPanel'
import OutputCurrencyPanel from './OutputCurrencyPanel'
import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import TradePrice from './TradePrice'
import TradeSummary from './TradeSummary'

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

  const isSelectCurrencyManually = useSelector((state: AppState) => state.swap.isSelectTokenManually)

  const theme = useTheme()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()

  const parsedAmount = useParsedAmountFromInputCurrency()

  const currencies = {
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyIn,
  }

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isAdvancedMode])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  // it's safe to put undefined here for now as we're not using any action that involves `trade`
  const { mixpanelHandler } = useMixpanel(undefined, currencies)

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection],
  )

  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports)

  useEffect(() => {
    // when remove token imported
    if (!prevTokenImports) return
    const isRemoved = prevTokenImports?.length > tokenImports.length
    if (!isRemoved || prevTokenImports[0].chainId !== chainId) return

    const addressIn = currencyIn?.wrapped?.address
    const addressOut = currencyOut?.wrapped?.address
    // removed token => deselect input
    const tokenRemoved = prevTokenImports.filter(
      token => !tokenImports.find(token2 => token2.address === token.address),
    )

    tokenRemoved.forEach(({ address }: Token) => {
      if (address === addressIn || !currencyIn) {
        onResetSelectCurrency(Field.INPUT)
      }
      if (address === addressOut || !currencyOut) {
        onResetSelectCurrency(Field.OUTPUT)
      }
    })
  }, [tokenImports, chainId, prevTokenImports, currencyIn, currencyOut, onResetSelectCurrency])

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually)

  useEffect(() => {
    if (isAdvancedMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
  }, [isAdvancedMode, mixpanelHandler])

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
            <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
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
