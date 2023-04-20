import { GetRoute } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import SquidLogoDark from 'assets/images/squid_dark.png'
import SquidLogoLight from 'assets/images/squid_light.png'
import { ReactComponent as ArrowUp } from 'assets/svg/arrow_up.svg'
import { ButtonLight } from 'components/Button'
import CurrencyInputPanelBridge from 'components/CurrencyInputPanel/CurrencyInputPanelBridge'
import { RowBetween } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import { AdvancedSwapDetailsDropdownCrossChain } from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import TradeTypeSelection from 'pages/CrossChain/SwapForm/TradeTypeSelection'
import TradePrice from 'pages/CrossChain/TradePrice'
import { getRouInfo } from 'pages/CrossChain/helpers'
import useDefaultTokenChain from 'pages/CrossChain/useDefaultTokenChain'
import useGetRouteCrossChain from 'pages/CrossChain/useGetRoute'
import useValidateInput from 'pages/CrossChain/useValidateInput'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCrossChainHandlers } from 'state/crossChain/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCrossChainSetting, useDegenModeManager, useIsDarkMode, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types/index'
import { uint256ToFraction } from 'utils/numbers'
import { checkPriceImpact } from 'utils/prices'

import { ConfirmCrossChainModal } from '../../Bridge/ComfirmBridgeModal'
import ErrorWarningPanel from '../../Bridge/ErrorWarning'

const ArrowWrapper = styled.div`
  padding: 4px 6px;
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 100%;
`

export default function SwapForm() {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const changeNetwork = useChangeNetwork()
  const [isDegenMode] = useDegenModeManager()

  const [slippage] = useUserSlippageTolerance()

  const {
    listTokenIn,
    listChainOut,
    listTokenOut,
    chains,
    currencyIn,
    currencyOut,
    loadingToken,
    chainIdOut,
    squidInstance,
    inputAmount,
  } = useDefaultTokenChain()

  const debouncedInput = useDebounce(inputAmount, INPUT_DEBOUNCE_TIME)
  const {
    setting: { enableExpressExecution },
  } = useCrossChainSetting()
  const routeParams: GetRoute | undefined = useMemo(() => {
    if (!currencyIn || !currencyOut || !chainIdOut || !account || !Number(debouncedInput)) return
    return {
      fromChain: chainId,
      toChain: chainIdOut,
      fromToken: currencyIn?.wrapped.address,
      toToken: currencyOut.wrapped.address,
      fromAmount: tryParseAmount(debouncedInput, currencyIn)?.quotient.toString() ?? '',
      toAddress: account,
      slippage: slippage / 100,
      enableExpress: enableExpressExecution,
      // customContractCalls?: ContractCall[]; // todo
    }
  }, [currencyIn, currencyOut, account, debouncedInput, chainId, chainIdOut, slippage, enableExpressExecution])

  const {
    route,
    getRoute: refreshRoute,
    error: errorGetRoute,
    loading: gettingRoute,
  } = useGetRouteCrossChain(routeParams)
  const { outputAmount, amountUsdIn, amountUsdOut, exchangeRate, priceImpact } = getRouInfo(route)
  const { selectCurrency, selectDestChain, setInputAmount } = useCrossChainHandlers()

  const toggleWalletModal = useWalletModalToggle()
  const isDark = useIsDarkMode()
  const theme = useTheme()

  // modal and loading
  const [swapState, setSwapState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const inputError = useValidateInput({ inputAmount, route, errorGetRoute })

  const handleTypeInput = useCallback(
    (value: string) => {
      if (currencyIn) setInputAmount(value)
    },
    [currencyIn, setInputAmount],
  )

  const showPreview = () => {
    setSwapState(state => ({ ...state, showConfirm: true, errorMessage: '', txHash: '' }))
  }

  const hidePreview = useCallback(() => {
    setSwapState(state => ({ ...state, showConfirm: false }))
  }, [])

  const addTransaction = useTransactionAdder()
  const handleSwap = useCallback(async () => {
    try {
      if (!library || !squidInstance || !route || !inputAmount || !outputAmount || !currencyIn || !currencyOut) return
      setSwapState(state => ({ ...state, attemptingTxn: true }))
      const tx = await squidInstance.executeRoute({
        signer: library.getSigner(),
        route,
      })
      const txReceipt = await tx.wait()
      setInputAmount('')
      setSwapState(state => ({ ...state, attemptingTxn: false, txHash: txReceipt.transactionHash }))
      addTransaction({
        type: TRANSACTION_TYPE.CROSS_CHAIN_SWAP,
        hash: txReceipt.transactionHash,
        extraInfo: {
          tokenSymbolIn: currencyIn?.symbol ?? '',
          tokenSymbolOut: currencyOut?.symbol ?? '',
          tokenAmountIn: inputAmount,
          tokenAmountOut: uint256ToFraction(outputAmount, currencyOut.decimals).toSignificant(6),
          tokenAddressIn: currencyIn?.address,
          tokenAddressOut: currencyOut?.address,
          tokenLogoURLIn: currencyIn.logoURI,
          tokenLogoURLOut: currencyOut.logoURI,
          chainIdIn: chainId,
          chainIdOut,
          rate: exchangeRate,
        },
      })
    } catch (error) {
      console.error(error)
      setSwapState(state => ({ ...state, attemptingTxn: false, errorMessage: error?.message || error }))
    }
  }, [
    route,
    squidInstance,
    library,
    addTransaction,
    chainId,
    chainIdOut,
    currencyIn,
    currencyOut,
    inputAmount,
    outputAmount,
    exchangeRate,
    setInputAmount,
  ])

  const maxAmountInput = useCurrencyBalance(currencyIn)?.toExact()
  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput)
  }, [maxAmountInput, setInputAmount])

  const onCurrencySelect = useCallback(
    (currencyIn: WrappedTokenInfo) => {
      selectCurrency({ currencyIn, currencyOut })
    },
    [selectCurrency, currencyOut],
  )
  const onCurrencySelectDest = useCallback(
    (currencyOut: WrappedTokenInfo) => {
      selectCurrency({ currencyIn, currencyOut })
    },
    [selectCurrency, currencyIn],
  )
  const onSelectDestNetwork = useCallback(
    (chainId: ChainId) => {
      selectDestChain(chainId)
    },
    [selectDestChain],
  )

  const disableBtnSwap =
    !!inputError || [inputAmount, currencyIn, currencyOut, chainIdOut].some(e => !e) || gettingRoute

  const priceImpactResult = checkPriceImpact(priceImpact || -1)

  return (
    <>
      <Flex style={{ flexDirection: 'column', gap: '1rem' }}>
        <Flex flexDirection={'column'}>
          <CurrencyInputPanelBridge
            tooltipNotSupportChain={t`Axelar/Squid doesn't support this chain`}
            isCrossChain
            loadingToken={loadingToken}
            tokens={listTokenIn}
            currency={currencyIn}
            chainIds={chains}
            selectedChainId={chainId}
            onSelectNetwork={changeNetwork}
            value={inputAmount}
            onUserInput={handleTypeInput}
            onMax={handleMaxInput}
            onCurrencySelect={onCurrencySelect}
            id="swap-currency-input"
            usdValue={amountUsdIn || ''}
          />
        </Flex>

        <Flex justifyContent="space-between" alignItems={'center'}>
          <TradePrice route={route} refresh={refreshRoute} disabled={swapState.showConfirm} />
          <ArrowWrapper>
            <ArrowUp fill={theme.subText} width={14} height={14} />
          </ArrowWrapper>
        </Flex>

        <div>
          <CurrencyInputPanelBridge
            tooltipNotSupportChain={t`Axelar/Squid doesn't support this chain`}
            isCrossChain
            isOutput
            loadingToken={loadingToken}
            tokens={listTokenOut}
            currency={currencyOut}
            chainIds={listChainOut}
            onSelectNetwork={onSelectDestNetwork}
            selectedChainId={chainIdOut}
            value={
              currencyOut && outputAmount
                ? uint256ToFraction(outputAmount, currencyOut?.decimals).toSignificant(currencyOut?.decimals)
                : ''
            }
            onCurrencySelect={onCurrencySelectDest}
            id="swap-currency-output"
            usdValue={amountUsdOut || ''}
          />
        </div>

        <SlippageSetting
          isCrossChain
          isStablePairSwap={false}
          tooltip={
            <Text>
              <Trans>
                During the processing phase, if the price changes by more than this %, you will receive axlUSDC at the
                destination chain instead. Read more{' '}
                <ExternalLink href={'https://axelar.network/blog/what-is-axlusdc-and-how-do-you-get-it'}>
                  here ↗
                </ExternalLink>
              </Trans>
            </Text>
          }
        />

        <TradeTypeSelection />
        <SlippageWarningNote rawSlippage={slippage} isStablePairSwap={false} />

        {!!priceImpact && <PriceImpactNote priceImpact={Number(priceImpact)} isDegenMode={isDegenMode} />}

        {inputError?.state && (
          <ErrorWarningPanel title={inputError?.tip} type={inputError?.state} desc={inputError?.desc} />
        )}

        {account ? (
          <SwapButtonWithPriceImpact
            onClick={showPreview}
            disabled={disableBtnSwap}
            showLoading={gettingRoute}
            priceImpact={priceImpact || -1}
            isProcessingSwap={swapState.attemptingTxn}
            isApproved={true}
            route={route}
            minimal={false}
            showNoteGetRoute={priceImpactResult.isHigh || priceImpactResult.isVeryHigh || priceImpactResult.isInvalid}
            disabledText={t`Swap`}
          />
        ) : (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        )}

        <AdvancedSwapDetailsDropdownCrossChain route={route} />

        <RowBetween>
          <Flex
            alignItems={'center'}
            color={theme.subText}
            fontSize={12}
            fontWeight={500}
            opacity={0.5}
            sx={{ gap: '4px' }}
          >
            Powered by
            <ExternalLink href="https://squidrouter.com/" style={{ width: 'fit-content' }}>
              <img src={isDark ? SquidLogoLight : SquidLogoDark} alt="kyberswap with squid" height={22} />
            </ExternalLink>
          </Flex>
          <Text color={theme.primary} style={{ cursor: 'pointer', fontSize: 12, fontWeight: '500' }}>
            <Trans>Guide</Trans>
          </Text>
        </RowBetween>
      </Flex>

      <ConfirmCrossChainModal route={route} swapState={swapState} onDismiss={hidePreview} onSwap={handleSwap} />
    </>
  )
}
