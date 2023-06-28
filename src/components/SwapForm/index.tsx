import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { parseGetRouteResponse } from 'services/route/utils'
import styled from 'styled-components'

import AddressInputPanel from 'components/AddressInputPanel'
import { Clock } from 'components/Icons'
import { AutoRow } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useCheckStablePairSwap from 'components/SwapForm/hooks/useCheckStablePairSwap'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradePrice from 'components/swapv2/TradePrice'
import { Wrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { DetailedRouteSummary } from 'types/route'
import { currencyId } from 'utils/currencyId'

import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import SwapActionButton from './SwapActionButton'
import TradeSummary from './TradeSummary'
import TradeTypeSelection from './TradeTypeSelection'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  align-items: center;
  height: fit-content;
`
export type SwapFormProps = {
  hidden: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>

  isDegenMode: boolean
  slippage: number
  transactionTimeout: number
  permit?: string

  onChangeCurrencyIn: (c: Currency) => void
  onChangeCurrencyOut: (c: Currency) => void
  goToSettingsView: () => void
}

const SwapForm: React.FC<SwapFormProps> = props => {
  const {
    hidden,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    setRouteSummary,
    isDegenMode,
    slippage,
    transactionTimeout,
    permit,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
  } = props

  const { isEVM, isSolana, chainId } = useActiveWeb3React()
  const navigate = useNavigate()
  const [isProcessingSwap, setProcessingSwap] = useState(false)
  const { typedValue } = useSwapState()
  const [recipient, setRecipient] = useState<string | null>(null)
  const [isSaveGas, setSaveGas] = useState(false)
  const theme = useTheme()

  const { onUserInput: updateInputAmount } = useSwapActionHandlers()
  const onUserInput = useCallback(
    (value: string) => {
      updateInputAmount(Field.INPUT, value)
    },
    [updateInputAmount],
  )
  useEffect(() => {
    onUserInput('1')
  }, [onUserInput])

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const { wrapType, inputError: wrapInputError, execute: onWrap } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const isWrapOrUnwrap = wrapType !== WrapType.NOT_APPLICABLE

  const isStablePairSwap = useCheckStablePairSwap(currencyIn, currencyOut)

  const { fetcher: getRoute, result } = useGetRoute({
    currencyIn,
    currencyOut,
    isSaveGas,
    parsedAmount,
    isProcessingSwap,
  })

  const { data: getRouteRawResponse, isFetching: isGettingRoute, error: getRouteError } = result
  const getRouteResponse = useMemo(() => {
    if (!getRouteRawResponse?.data || getRouteError || !currencyIn || !currencyOut) {
      return undefined
    }

    return parseGetRouteResponse(getRouteRawResponse.data, currencyIn, currencyOut)
  }, [currencyIn, currencyOut, getRouteError, getRouteRawResponse])

  const routeSummary = getRouteResponse?.routeSummary

  const buildRoute = useBuildRoute({
    recipient: isDegenMode && recipient ? recipient : '',
    routeSummary: getRouteRawResponse?.data?.routeSummary || undefined,
    slippage,
    transactionTimeout,
    permit,
  })

  const swapInputError = useGetInputError({
    currencyIn,
    currencyOut,
    typedValue,
    recipient,
    balanceIn,
    parsedAmountFromTypedValue: parsedAmount,
  })

  const handleChangeCurrencyIn = (c: Currency) => {
    onChangeCurrencyIn(c)
  }

  const handleChangeCurrencyOut = (c: Currency) => {
    onChangeCurrencyOut(c)
  }

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once, and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput])

  useEffect(() => {
    setRouteSummary(routeSummary)
  }, [routeSummary, setRouteSummary])

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      isSaveGas={isSaveGas}
      recipient={recipient}
      isStablePairSwap={isStablePairSwap}
      isAdvancedMode={isDegenMode}
    >
      <Box sx={{ flexDirection: 'column', gap: '16px', display: hidden ? 'none' : 'flex' }}>
        <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
          <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
            <InputCurrencyPanel
              wrapType={wrapType}
              typedValue={typedValue}
              setTypedValue={onUserInput}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              balanceIn={balanceIn}
              onChangeCurrencyIn={handleChangeCurrencyIn}
            />

            <AutoRow justify="space-between">
              <Flex alignItems="center" style={{ gap: '4px' }}>
                {!isWrapOrUnwrap && (
                  <>
                    <RefreshButton
                      shouldDisable={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
                      callback={getRoute}
                      size={16}
                    />
                    <TradePrice price={routeSummary?.executionPrice} />
                  </>
                )}
              </Flex>

              <Flex sx={{ gap: '12px' }}>
                {chainId === ChainId.LINEA_TESTNET ? null : (
                  <PriceAlertButton
                    onClick={() =>
                      navigate(
                        `${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}?${stringify({
                          amount: typedValue || undefined,
                          inputCurrency: currencyId(currencyIn, chainId),
                          outputCurrency: currencyId(currencyOut, chainId),
                        })}`,
                      )
                    }
                  >
                    <Clock size={14} color={theme.subText} />
                    <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
                      <Trans>Price Alert</Trans>
                    </Text>
                  </PriceAlertButton>
                )}
                <ReverseTokenSelectionButton onClick={() => currencyIn && handleChangeCurrencyOut(currencyIn)} />
              </Flex>
            </AutoRow>

            <OutputCurrencyPanel
              wrapType={wrapType}
              parsedAmountIn={parsedAmount}
              parsedAmountOut={routeSummary?.parsedAmountOut}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              amountOutUsd={routeSummary?.amountOutUsd}
              onChangeCurrencyOut={handleChangeCurrencyOut}
            />

            {isDegenMode && isEVM && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}
            <SlippageSettingGroup isWrapOrUnwrap={isWrapOrUnwrap} isStablePairSwap={isStablePairSwap} />
          </Flex>
        </Wrapper>
        <Flex flexDirection="column" style={{ gap: '1.25rem' }}>
          <TradeTypeSelection isSaveGas={isSaveGas} setSaveGas={setSaveGas} />

          {!isWrapOrUnwrap && <SlippageWarningNote rawSlippage={slippage} isStablePairSwap={isStablePairSwap} />}

          <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} />

          <SwapActionButton
            isGettingRoute={isGettingRoute}
            parsedAmountFromTypedValue={parsedAmount}
            balanceIn={balanceIn}
            balanceOut={balanceOut}
            isDegenMode={isDegenMode}
            typedValue={typedValue}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            wrapInputError={wrapInputError}
            wrapType={wrapType}
            routeSummary={routeSummary}
            isProcessingSwap={isProcessingSwap}
            setProcessingSwap={setProcessingSwap}
            onWrap={onWrap}
            buildRoute={buildRoute}
            swapInputError={swapInputError}
          />

          {!isWrapOrUnwrap && <TradeSummary routeSummary={routeSummary} slippage={slippage} />}
        </Flex>
      </Box>
    </SwapFormContextProvider>
  )
}

export default SwapForm
