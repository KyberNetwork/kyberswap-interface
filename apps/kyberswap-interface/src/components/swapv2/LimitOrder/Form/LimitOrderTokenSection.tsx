import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { CSSProperties, ReactNode } from 'react'

import ArrowRotate from 'components/ArrowRotate'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { RowBetween } from 'components/Row'
import Tooltip from 'components/Tooltip'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-xs font-medium text-subText">{children}</div>
)

type Props = {
  chainId: number
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  inputError: string | ReactNode
  outPutError: string | ReactNode
  estimateUsdIn: string | undefined
  estimateUsdOut: string | undefined
  showApproveFlow: boolean
  isEdit: boolean
  rotate: boolean
  tradeInfo: BaseTradeInfo | undefined
  loadingTrade: boolean
  styleTooltip: CSSProperties
  onSetInput: (input: string) => void
  onSetOutput: (output: string) => void
  handleMaxInput: () => void
  handleInputSelect: (currency: Currency) => void
  handleOutputSelect: (currency: Currency) => void
  handleRotateClick: () => void
  trackingTouchInput: () => void
  trackingTouchSelectToken: () => void
}

export default function LimitOrderTokenSection({
  chainId,
  currencyIn,
  currencyOut,
  inputAmount,
  outputAmount,
  inputError,
  outPutError,
  estimateUsdIn,
  estimateUsdOut,
  showApproveFlow,
  isEdit,
  rotate,
  tradeInfo,
  loadingTrade,
  styleTooltip,
  onSetInput,
  onSetOutput,
  handleMaxInput,
  handleInputSelect,
  handleOutputSelect,
  handleRotateClick,
  trackingTouchInput,
  trackingTouchSelectToken,
}: Props) {
  return (
    <>
      <Tooltip
        text={inputError}
        show={!!inputError}
        placement="top"
        style={styleTooltip}
        width="fit-content"
        dataTestId="error-message"
      >
        <CurrencyInputPanel
          error={!!inputError}
          value={inputAmount}
          positionMax="top"
          onUserInput={onSetInput}
          onMax={handleMaxInput}
          otherCurrency={currencyOut}
          estimatedUsd={estimateUsdIn}
          onFocus={trackingTouchInput}
          onCurrencySelect={handleInputSelect}
          currency={currencyIn}
          showPinnedTokens
          id="create-limit-order-input-tokena"
          dataTestId="limit-order-input-tokena"
          maxCurrencySymbolLength={6}
          filterWrap
          onClickSelect={trackingTouchSelectToken}
          lockIcon={showApproveFlow}
          disableCurrencySelect={isEdit}
          label={
            <Label>
              <Trans>You Sell</Trans>
            </Label>
          }
          positionLabel="in"
          customChainId={chainId}
          trackingSource="limit_order"
        />
      </Tooltip>

      <RowBetween>
        {currencyIn && currencyOut ? (
          <TradePrice
            price={tradeInfo}
            className="w-fit italic text-text"
            label={t`Est. Market Price:`}
            loading={loadingTrade}
            symbolIn={currencyIn?.symbol}
            symbolOut={currencyOut?.symbol}
          />
        ) : (
          <div />
        )}
        <ArrowRotate
          rotate={rotate}
          onClick={isEdit ? undefined : handleRotateClick}
          className="size-7 bg-buttonGray p-1"
        />
      </RowBetween>

      <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
        <CurrencyInputPanel
          maxLength={16}
          value={outputAmount}
          error={!!outPutError}
          currency={currencyOut}
          onUserInput={onSetOutput}
          otherCurrency={currencyIn}
          estimatedUsd={estimateUsdOut}
          onFocus={trackingTouchInput}
          id="create-limit-order-input-tokenb"
          dataTestId="limit-order-input-tokenb"
          onCurrencySelect={handleOutputSelect}
          positionMax="top"
          showPinnedTokens
          maxCurrencySymbolLength={6}
          filterWrap
          onClickSelect={trackingTouchSelectToken}
          disableCurrencySelect={isEdit}
          label={
            <Label>
              <Trans>You Buy</Trans>
            </Label>
          }
          positionLabel="in"
          customChainId={chainId}
          trackingSource="limit_order"
        />
      </Tooltip>
    </>
  )
}
