import FeeControlGroup from 'components/FeeControlGroup'
import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import { useERC8056SwapInfo } from 'components/SwapForm/CurrencyInput/ERC8056Info'
import { RecipientInput, RecipientToggle } from 'components/SwapForm/RecipientInput'
import MEVProtection from 'components/SwapForm/Settings/MEVProtection'
import SingleChainQuoteDetails from 'components/SwapForm/SingleChain/SingleChainQuoteDetails'
import { useSingleChainSwapContext } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import SwapActionButton from 'components/SwapForm/SwapActionButton'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import MultichainKNCNote from 'components/SwapForm/Warnings/MultichainKNCNote'
import PriceImpactNote from 'components/SwapForm/Warnings/PriceImpactNote'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import { useERC8056TypedInput } from 'hooks/useERC8056Token'
import { useSlippageSettingByPage } from 'state/user/hooks'

/** Same-chain details and execution; fields and selection belong to the common form. */
export const SingleChainSwapContent = ({ isCurrencyLoading = false }: { isCurrencyLoading?: boolean }) => {
  const {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isDegenMode,
    slippage,
    customChainId,
    chainId,
    chainError,
    typedValue,
    onUserInput,
    recipient,
    recipientInputValue,
    recipientError,
    recipientMessage,
    onRecipientChange,
    hasCustomRecipient,
    showRecipientInput,
    toggleRecipient,
    parsedAmount,
    wrapType,
    wrapInputError,
    onWrap,
    isWrapOrUnwrap,
    refresh,
    routeLoading,
    isGettingRoute,
    routeSummary,
    isFeeTampered,
    buildRoute,
    review,
    openReview,
    rebuildReview,
    confirmReview,
    dismissReview,
  } = useSingleChainSwapContext()

  const { isSlippageControlPinned } = useSlippageSettingByPage()

  const erc8056Info = useERC8056SwapInfo({ chainId, currencyIn, currencyOut, balanceIn, balanceOut })
  const { displayTypedValue } = useERC8056TypedInput(erc8056Info.inputInfo, typedValue, onUserInput)

  const swapInputError = useGetInputError({
    currencyIn,
    currencyOut,
    typedValue,
    recipient,
    recipientMessage,
    balanceIn,
    parsedAmountFromTypedValue: parsedAmount,
  })

  const { message: honeypotWarning } = useHoneypotWarning({
    chainId: currencyOut?.chainId ?? chainId,
    tokenAddress: currencyOut?.wrapped.address,
    tokenSymbol: currencyOut?.symbol,
  })

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      displayTypedValue={displayTypedValue}
      inputERC8056Info={erc8056Info.inputInfo}
      outputERC8056Info={erc8056Info.outputInfo}
      recipient={recipient}
      isAdvancedMode={isDegenMode}
    >
      <Stack className="gap-2">
        <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

        {!isWrapOrUnwrap && (
          <SingleChainQuoteDetails
            chainId={chainId}
            recipientToggle={
              hasCustomRecipient ? (
                <RecipientToggle expanded={showRecipientInput} onToggle={toggleRecipient} />
              ) : undefined
            }
            recipient={
              hasCustomRecipient ? (
                <RecipientInput
                  hideLabel
                  mode="evm"
                  value={recipientInputValue}
                  expanded={showRecipientInput}
                  error={recipientError}
                  onChange={onRecipientChange}
                  onToggle={toggleRecipient}
                />
              ) : undefined
            }
            loading={routeLoading}
            routeSummary={routeSummary}
            slippage={slippage}
            refresh={refresh}
            isFeeTampered={isFeeTampered}
          />
        )}

        {!isWrapOrUnwrap && <FeeControlGroup />}
        {(isWrapOrUnwrap || !isSlippageControlPinned) && <MEVProtection chainId={chainId} className="w-fit self-end" />}
        <HoneypotWarning message={honeypotWarning} />

        <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} showLimitOrderLink />
      </Stack>

      <SwapActionButton
        isCurrencyLoading={isCurrencyLoading}
        chainError={chainError}
        isGettingRoute={isGettingRoute}
        parsedAmountFromTypedValue={parsedAmount}
        balanceIn={balanceIn}
        balanceOut={balanceOut}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        wrapInputError={wrapInputError}
        wrapType={wrapType}
        routeSummary={routeSummary}
        review={review}
        openReviewSession={openReview}
        rebuildReviewSession={rebuildReview}
        confirmReviewSession={confirmReview}
        dismissReviewSession={dismissReview}
        onWrap={onWrap}
        buildRoute={buildRoute}
        swapInputError={swapInputError}
        customChainId={customChainId}
      />
    </SwapFormContextProvider>
  )
}
