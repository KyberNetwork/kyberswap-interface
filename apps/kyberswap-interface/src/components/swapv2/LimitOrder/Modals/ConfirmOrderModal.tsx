import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonPrimary, ButtonWarning } from 'components/Button'
import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React } from 'hooks'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { formatDisplayNumber } from 'utils/numbers'

import { formatAmountOrder } from '../helpers'
import { CancelOrderType, EditOrderInfo, RateInfo } from '../type'
import { Container, Header, ListInfo, Note, Rate, Value } from './styled'

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
  editOrderInfo,
  showConfirmContent,
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
  editOrderInfo?: EditOrderInfo
  showConfirmContent: boolean
}) {
  const { account } = useActiveWeb3React()
  const [confirmed, setConfirmed] = useState(false)
  const shouldShowConfirmFlow = percentDiff < WORSE_PRICE_DIFF_THRESHOLD
  const theme = useTheme()
  const displayCurrencyOut = useMemo(() => {
    return currencyOut?.isNative ? currencyOut.wrapped : currencyOut
  }, [currencyOut])

  const { cancelType, gasFee, isEdit } = editOrderInfo || {}

  const listData = useMemo(() => {
    const nodes = [
      {
        label: t`I pay`,
        content: currencyIn && inputAmount && (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <Text>
              {formatAmountOrder(inputAmount)} {currencyIn?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`and receive`,
        content: displayCurrencyOut && outputAmount && (
          <Value>
            <CurrencyLogo currency={displayCurrencyOut} style={styleLogo} />
            <Text>
              {formatAmountOrder(outputAmount)} {displayCurrencyOut?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`at`,
        content: account && <Rate rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={displayCurrencyOut} />,
      },
      {
        label: t`before the order expires on`,
        content: account && (
          <Value>
            <Text>{dayjs(expiredAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Value>
        ),
      },
    ]
    if (isEdit)
      nodes.push({
        label: t`Edit Type`,
        content: (
          <Value>
            <Text>
              {cancelType === CancelOrderType.GAS_LESS_CANCEL ? (
                <Trans>Gasless Edit</Trans>
              ) : (
                <Trans>
                  Hard Edit (
                  <Text as="span" color={theme.red}>
                    ~{formatDisplayNumber(gasFee, { style: 'currency', fractionDigits: 4 })}
                  </Text>{' '}
                  gas fees)
                </Trans>
              )}
            </Text>
          </Value>
        ),
      })
    return nodes
  }, [
    account,
    currencyIn,
    displayCurrencyOut,
    inputAmount,
    rateInfo,
    outputAmount,
    expiredAt,
    isEdit,
    gasFee,
    cancelType,
    theme,
  ])

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
        symbolOut={displayCurrencyOut?.symbol}
      />
      <Note note={note} />

      {warningMessage?.length > 0 && (
        <Column gap="16px">
          {warningMessage?.map((mess, i) => (
            <ErrorWarningPanel key={i} type="warn" title={mess} />
          ))}
        </Column>
      )}

      {isEdit ? null : (
        <Flex
          sx={{
            gap: '12px',
          }}
        >
          {renderConfirmPriceButton()}
          {renderPlaceOrderButton()}
        </Flex>
      )}
    </>
  )

  if (showConfirmContent) return renderConfirmData()

  const renderConfirmationContent = (): ReactNode => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage && !isEdit ? (
            <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
          ) : (
            <Container>
              <Header title={t`Review your order`} onDismiss={handleDismiss} />
              {renderConfirmData()}
            </Container>
          )}
        </div>
      </Flex>
    )
  }

  return (
    <TransactionConfirmationModal
      maxWidth={450}
      hash={flowState.txHash}
      isOpen={flowState.showConfirm}
      onDismiss={handleDismiss}
      attemptingTxn={flowState.attemptingTxn}
      attemptingTxnContent={isEdit ? renderConfirmationContent : undefined}
      content={renderConfirmationContent}
      pendingText={flowState.pendingText || t`Placing order`}
    />
  )
})
