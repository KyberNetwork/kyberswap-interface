import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useState } from 'react'

import { ButtonPrimary, ButtonWarning } from 'components/Button'
import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { Container, Header, ListInfo, Note, Rate, Value } from 'components/swapv2/LimitOrder/Modals/styled'
import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/swapv2/LimitOrder/const'
import { formatAmountOrder } from 'components/swapv2/LimitOrder/helpers'
import { RateInfo } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { TransactionFlowState } from 'types/TransactionFlowState'

const styleLogo = { width: 20, height: 20 }

export default memo(function ConfirmOrderModal({
  onSubmit,
  currencyIn,
  currencyOut,
  onDismiss,
  flowState,
  outputAmount,
  inputAmount,
  expiredAt,
  marketPrice,
  rateInfo,
  note,
  warningMessage,
  percentDiff,
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  expiredAt: number
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
  note?: string
  warningMessage: ReactNode[]
  percentDiff: number
}) {
  const { account } = useActiveWeb3React()
  const [confirmed, setConfirmed] = useState(false)
  const shouldShowConfirmFlow = percentDiff < WORSE_PRICE_DIFF_THRESHOLD

  const listData = useMemo(() => {
    const nodes = [
      {
        label: t`I pay`,
        content: currencyIn && inputAmount && (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <span>
              {formatAmountOrder(inputAmount)} {currencyIn?.symbol}
            </span>
          </Value>
        ),
      },
      {
        label: t`and receive`,
        content: outputAmount && (
          <Value>
            <CurrencyLogo currency={currencyOut} style={styleLogo} size={'20px'} />
            <span>
              {formatAmountOrder(outputAmount)} {currencyOut?.symbol}
            </span>
          </Value>
        ),
      },
      {
        label: t`at`,
        content: account && <Rate rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={currencyOut} />,
      },
      {
        label: t`before the order expires on`,
        content: account && (
          <Value>
            <span>{dayjs(expiredAt).format('DD/MM/YYYY HH:mm')}</span>
          </Value>
        ),
      },
    ]
    return nodes
  }, [account, currencyIn, currencyOut, inputAmount, rateInfo, outputAmount, expiredAt])

  const handleDismiss = () => {
    onDismiss()

    // delay till the animation's done
    setTimeout(() => {
      setConfirmed(false)
    }, 200)
  }

  const renderConfirmPriceButton = () => {
    if (!shouldShowConfirmFlow) {
      return null
    }

    if (confirmed) {
      return (
        <ButtonPrimary disabled>
          <Trans>Confirm Price</Trans>
        </ButtonPrimary>
      )
    }

    return (
      <ButtonWarning onClick={() => setConfirmed(true)}>
        <Trans>Confirm Price</Trans>
      </ButtonWarning>
    )
  }

  const renderPlaceOrderButton = () => {
    const shouldDisable = shouldShowConfirmFlow && !confirmed

    if (shouldDisable) {
      return (
        <ButtonPrimary id="place-order-button" disabled>
          <Trans>Place Order</Trans>
        </ButtonPrimary>
      )
    }

    if (warningMessage?.length) {
      return (
        <ButtonWarning id="place-order-button" onClick={onSubmit}>
          <Trans>Place Order</Trans>
        </ButtonWarning>
      )
    }

    return (
      <ButtonPrimary id="place-order-button" onClick={onSubmit}>
        <Trans>Place Order</Trans>
      </ButtonPrimary>
    )
  }

  const renderConfirmData = () => (
    <>
      <ListInfo
        listData={listData}
        marketPrice={marketPrice}
        symbolIn={currencyIn?.symbol}
        symbolOut={currencyOut?.symbol}
      />
      <Note note={note} />

      {warningMessage?.length > 0 && (
        <Column className="gap-4">
          {warningMessage?.map((mess, i) => (
            <ErrorWarningPanel key={i} type="warn" title={mess} />
          ))}
        </Column>
      )}

      <div className="flex gap-3">
        {renderConfirmPriceButton()}
        {renderPlaceOrderButton()}
      </div>
    </>
  )

  const renderConfirmationContent = (): ReactNode => {
    return (
      <div className="flex w-full flex-col">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
          ) : (
            <Container>
              <Header title={t`Review your order`} onDismiss={handleDismiss} />
              {renderConfirmData()}
            </Container>
          )}
        </div>
      </div>
    )
  }

  return (
    <TransactionConfirmationModal
      maxWidth={450}
      hash={flowState.txHash}
      isOpen={flowState.showConfirm}
      onDismiss={handleDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={renderConfirmationContent}
      pendingText={flowState.pendingText || t`Placing order`}
    />
  )
})
