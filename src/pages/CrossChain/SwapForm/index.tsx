import { RouteRequest } from '@0xsquid/sdk/dist/types'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { useSaveCrossChainTxsMutation } from 'services/crossChain'
import styled from 'styled-components'

import SquidLogoLight from 'assets/images/squid_light.png'
import { ReactComponent as ArrowUp } from 'assets/svg/arrow_up.svg'
import { ButtonLight } from 'components/Button'
import CurrencyInputPanelBridge from 'components/CurrencyInputPanel/CurrencyInputPanelBridge'
import { RowBetween } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import useCheckStablePairSwap from 'components/SwapForm/hooks/useCheckStablePairSwap'
import { formatDurationCrossChain } from 'components/swapv2/AdvancedSwapDetails'
import { AdvancedSwapDetailsDropdownCrossChain } from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { CROSS_CHAIN_CONFIG } from 'constants/env'
import { INPUT_DEBOUNCE_TIME, TRANSACTION_STATE_DEFAULT, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { captureExceptionCrossChain } from 'hooks/bridge/useBridgeCallback'
import useDebounce from 'hooks/useDebounce'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ConfirmCrossChainModal } from 'pages/Bridge/ConfirmBridgeModal'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import TradeTypeSelection from 'pages/CrossChain/SwapForm/TradeTypeSelection'
import TradePrice from 'pages/CrossChain/TradePrice'
import useGetRouteCrossChain from 'pages/CrossChain/useGetRoute'
import useValidateInput, { useIsTokensSupport } from 'pages/CrossChain/useValidateInput'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount, useCheckCorrelatedPair } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCrossChainSetting, useDegenModeManager } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { uint256ToFraction } from 'utils/numbers'
import { checkPriceImpact } from 'utils/prices'
import { wait } from 'utils/retry'
import { getTokenAddress } from 'utils/tokenInfo'

const ArrowWrapper = styled.div`
  padding: 4px 6px;
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 100%;
`

export default function SwapForm() {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [isDegenMode] = useDegenModeManager()

  const [
    {
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
      formatRoute,
    },
  ] = useCrossChainState()

  const {
    setting: { enableExpressExecution, slippageTolerance },
  } = useCrossChainSetting()
  const isPairSupport = useIsTokensSupport()
  const debouncedInput = useDebounce(inputAmount, INPUT_DEBOUNCE_TIME)
  const routeParams: RouteRequest | undefined = useMemo(() => {
    if (!currencyIn || !currencyOut || !chainIdOut || !Number(debouncedInput) || !isPairSupport) return
    const parseAmount = tryParseAmount(debouncedInput, currencyIn)
    if (!parseAmount) return
    return {
      fromAddress: account || ZERO_ADDRESS,
      fromChain: chainId.toString(),
      toChain: chainIdOut.toString(),
      fromToken: getTokenAddress(currencyIn),
      toToken: getTokenAddress(currencyOut),
      fromAmount: parseAmount?.quotient.toString() ?? '',
      toAddress: account ?? '',
      slippageConfig: {
        slippage: slippageTolerance / 100,
        autoMode: 1,
      },
      enableBoost: enableExpressExecution,
      quoteOnly: !account,
    }
  }, [
    currencyIn,
    currencyOut,
    account,
    debouncedInput,
    chainId,
    chainIdOut,
    slippageTolerance,
    enableExpressExecution,
    isPairSupport,
  ])

  const {
    route,
    getRoute: refreshRoute,
    error: errorGetRoute,
    loading: gettingRoute,
    requestId,
  } = useGetRouteCrossChain(routeParams)
  const { outputAmount, amountUsdIn, amountUsdOut, exchangeRate, priceImpact, duration, totalFeeUsd } = formatRoute
  const { selectCurrencyIn, selectCurrencyOut, selectDestChain, setInputAmount } = useCrossChainHandlers()

  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()

  // modal and loading
  const [swapState, setSwapState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const inputError = useValidateInput({ inputAmount: debouncedInput, route, errorGetRoute })

  const handleTypeInput = useCallback(
    (value: string) => {
      if (currencyIn) setInputAmount(value)
    },
    [currencyIn, setInputAmount],
  )

  const { mixpanelHandler } = useMixpanel()
  const onTracking = useCallback(
    (type: MIXPANEL_TYPE) => {
      mixpanelHandler(type, {
        input_token: currencyIn?.symbol,
        output_token: currencyOut?.symbol,
        estimated_gas: totalFeeUsd,
        slippage: slippageTolerance,
        price_impact: priceImpact,
        trade_qty: inputAmount,
        advance_node: isDegenMode ? 'on' : 'off',
        processing_time_est: duration ? formatDurationCrossChain(duration) : 'none',
        source_chain: NETWORKS_INFO[chainId].name,
        destination_chain: chainIdOut && NETWORKS_INFO[chainIdOut].name,
      })
    },
    [
      currencyIn,
      currencyOut,
      duration,
      inputAmount,
      priceImpact,
      mixpanelHandler,
      slippageTolerance,
      totalFeeUsd,
      isDegenMode,
      chainId,
      chainIdOut,
    ],
  )

  const showPreview = () => {
    setSwapState(state => ({ ...state, showConfirm: true, errorMessage: '', txHash: '' }))
    onTracking(MIXPANEL_TYPE.CROSS_CHAIN_SWAP_INIT)
  }

  const hidePreview = useCallback(() => {
    setSwapState(state => ({ ...state, showConfirm: false }))
  }, [])

  const addTransaction = useTransactionAdder()
  const [saveTxsToDb] = useSaveCrossChainTxsMutation()

  const handleSwap = useCallback(async () => {
    try {
      if (!library || !squidInstance || !route || !inputAmount || !outputAmount || !currencyIn || !currencyOut) return
      setSwapState(state => ({ ...state, attemptingTxn: true }))
      onTracking(MIXPANEL_TYPE.CROSS_CHAIN_SWAP_CONFIRMED)
      const tx: any = await squidInstance.executeRoute({
        signer: library.getSigner(),
        route,
      })
      onTracking(MIXPANEL_TYPE.CROSS_CHAIN_TXS_SUBMITTED)
      setInputAmount('')
      setSwapState(state => ({ ...state, attemptingTxn: false, txHash: tx.hash }))
      const tokenAmountOut = getFullDisplayBalance(outputAmount, currencyOut.decimals, 6)
      const tokenAddressIn = getTokenAddress(currencyIn)
      const tokenAddressOut = getTokenAddress(currencyOut)
      addTransaction({
        type: TRANSACTION_TYPE.CROSS_CHAIN_SWAP,
        hash: tx.hash,
        extraInfo: {
          tokenSymbolIn: currencyIn?.symbol ?? '',
          tokenSymbolOut: currencyOut?.symbol ?? '',
          tokenAmountIn: inputAmount,
          tokenAmountOut,
          tokenAddressIn,
          tokenAddressOut,
          tokenLogoURLIn: (currencyIn as WrappedTokenInfo).logoURI,
          tokenLogoURLOut: (currencyOut as WrappedTokenInfo).logoURI,
          chainIdIn: chainId,
          chainIdOut,
          rate: exchangeRate,
        },
      })
      const payload = {
        walletAddress: account,
        srcChainId: chainId + '',
        dstChainId: chainIdOut + '',
        srcTxHash: tx.hash,
        srcTokenAddress: tokenAddressIn,
        dstTokenAddress: tokenAddressOut,
        srcAmount: inputAmount,
        dstAmount: tokenAmountOut,
      }

      saveTxsToDb(payload)
        .unwrap()
        .catch(e => {
          captureExceptionCrossChain(payload, e, 'CrossChain')
        })

      // trigger for partner
      const params = {
        transactionId: tx.hash,
        requestId,
        integratorId: CROSS_CHAIN_CONFIG.INTEGRATOR_ID,
      }
      await wait(2000)
      squidInstance.getStatus(params).catch(() => {
        setTimeout(() => {
          // retry
          squidInstance.getStatus(params).catch(e => {
            console.error('fire squid err', e)
          })
        }, 3000)
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
    saveTxsToDb,
    account,
    onTracking,
    requestId,
  ])

  const maxAmountInput = useCurrencyBalance(currencyIn)?.toExact()
  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput)
  }, [maxAmountInput, setInputAmount])

  const onCurrencySelect = useCallback(
    (currencyIn: WrappedTokenInfo) => {
      selectCurrencyIn(currencyIn)
    },
    [selectCurrencyIn],
  )
  const onCurrencySelectDest = useCallback(
    (currencyOut: WrappedTokenInfo) => {
      selectCurrencyOut(currencyOut)
    },
    [selectCurrencyOut],
  )
  const onSelectDestNetwork = useCallback(
    (chainId: ChainId) => {
      selectDestChain(chainId)
    },
    [selectDestChain],
  )

  const disableBtnSwap =
    !!inputError || [debouncedInput, currencyIn, currencyOut, chainIdOut].some(e => !e) || gettingRoute

  const priceImpactResult = checkPriceImpact(priceImpact)
  const isStablePairSwap = useCheckStablePairSwap(currencyIn, currencyOut)
  const isCorrelatedPair = useCheckCorrelatedPair()

  return (
    <>
      <Flex style={{ flexDirection: 'column', gap: '1rem' }}>
        <Flex flexDirection={'column'}>
          <CurrencyInputPanelBridge
            tooltipNotSupportChain={t`Axelar/Squid doesn't support this chain`}
            isCrossChain
            loadingToken={loadingToken}
            tokens={listTokenIn}
            currency={currencyIn as WrappedTokenInfo}
            chainIds={chains}
            selectedChainId={chainId}
            onSelectNetwork={changeNetwork}
            value={inputAmount}
            onUserInput={handleTypeInput}
            onMax={handleMaxInput}
            onCurrencySelect={onCurrencySelect}
            id="swap-currency-input"
            dataTestId="swap-currency-input"
            usdValue={amountUsdIn ?? ''}
          />
        </Flex>

        <Flex justifyContent="space-between" alignItems={'center'}>
          <TradePrice route={route} refresh={refreshRoute} disabled={swapState.showConfirm} loading={gettingRoute} />
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
            currency={currencyOut as WrappedTokenInfo}
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
            dataTestId="swap-currency-output"
            usdValue={amountUsdOut ?? ''}
          />
        </div>

        <SlippageSetting
          isCorrelatedPair={isCorrelatedPair}
          isStablePairSwap={isStablePairSwap}
          tooltip={
            <Text>
              <Trans>
                During the processing phase, if the price changes by more than this %, you will receive axlUSDC at the
                destination chain instead. Read more{' '}
                <ExternalLink href={'https://axelar.network/blog/what-is-axlusdc-and-how-do-you-get-it'}>
                  here ↗
                </ExternalLink>
                .
              </Trans>
            </Text>
          }
        />

        <TradeTypeSelection />
        <SlippageWarningNote
          rawSlippage={slippageTolerance}
          isStablePairSwap={isStablePairSwap}
          isCorrelatedPair={isCorrelatedPair}
        />

        {!!priceImpact && <PriceImpactNote priceImpact={Number(priceImpact)} isDegenMode={isDegenMode} />}

        {inputError?.state && !inputError?.insufficientFund && (
          <ErrorWarningPanel title={inputError?.tip} type={inputError?.state} desc={inputError?.desc} />
        )}

        {account ? (
          <SwapButtonWithPriceImpact
            onClick={showPreview}
            disabled={disableBtnSwap}
            showLoading={gettingRoute}
            priceImpact={priceImpact}
            isProcessingSwap={swapState.attemptingTxn}
            isApproved={true}
            route={route}
            minimal={false}
            showNoteGetRoute={priceImpactResult.isHigh || priceImpactResult.isVeryHigh || priceImpactResult.isInvalid}
            disabledText={(inputError?.insufficientFund ? inputError?.tip : '') || t`Swap`}
            showTooltipPriceImpact={false}
          />
        ) : (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect</Trans>
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
              <img src={SquidLogoLight} alt="kyberswap with squid" height={22} />
            </ExternalLink>
          </Flex>
          <Text color={theme.primary} style={{ cursor: 'pointer', fontSize: 12, fontWeight: '500' }}>
            <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/swap-between-different-tokens-across-chains">
              <Trans>Guide</Trans>
            </ExternalLink>
          </Text>
        </RowBetween>
      </Flex>

      <ConfirmCrossChainModal route={route} swapState={swapState} onDismiss={hidePreview} onSwap={handleSwap} />
    </>
  )
}
