import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, memo, useCallback, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonError, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { Swap as SwapIcon } from 'components/Icons'
import Logo from 'components/Logo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TransactionFlowState } from 'types'
import { formatNumberWithPrecisionRange } from 'utils'

import TradePrice from '../TradePrice'
import { calcPercentFilledOrder, formatAmountOrder, formatRateOrder, uint256ToFraction } from './helpers'
import { LimitOrder, LimitOrderStatus, RateInfo } from './type'
import useBaseTradeInfo from './useBaseTradeInfo'

const Container = styled.div`
  padding: 25px 30px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 25px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size:14px;
    padding: 16px 20px;
  `};
`
const Row = styled.div`
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const Value = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  gap: 5px;
  align-items: center;
  text-align: right;
`
const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

const formatValue = (amount: string) =>
  !amount ? '' : formatNumberWithPrecisionRange(parseFloat(amount.toString()), 0, 10)

type ListDataType = { label: string; content: ReactNode }[]
function ListInfo({ listData }: { listData: ListDataType }) {
  return (
    <Flex style={{ gap: 20 }} flexDirection="column">
      {listData.map(item => (
        <Row key={item.label}>
          <Label>{item.label}</Label>
          {item.content}
        </Row>
      ))}
    </Flex>
  )
}

const styleLogo = { width: 20, height: 20 }
const Rate = ({
  currencyIn,
  currencyOut,
  rateInfo,
  order,
}: {
  currencyIn?: Currency | undefined
  currencyOut?: Currency | undefined
  rateInfo?: RateInfo
  order?: LimitOrder
}) => {
  const [invertRate, setInvertRate] = useState(false)
  let symbolIn, symbolOut, rateStr
  if (order) {
    const { makerAssetSymbol, takerAssetSymbol } = order
    symbolIn = takerAssetSymbol
    symbolOut = makerAssetSymbol
    rateStr = formatRateOrder(order, invertRate)
  } else {
    if (!currencyIn || !currencyOut || !rateInfo) return null
    symbolIn = currencyIn?.symbol
    symbolOut = currencyOut?.symbol
    rateStr = formatAmountOrder(invertRate ? rateInfo.invertRate : rateInfo.rate, false)
  }
  return (
    <Value
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      onClick={() => setInvertRate(!invertRate)}
    >
      <Text>{`1 ${invertRate ? symbolOut : symbolIn} is equal to ${rateStr} ${
        invertRate ? symbolIn : symbolOut
      }`}</Text>
      <SwapIcon rotate={90} size={19} />
    </Value>
  )
}

const MarketInfo = ({ marketPrice }: { marketPrice: Price<Currency, Currency> | undefined }) => {
  const theme = useTheme()
  return (
    <Flex
      flexDirection={'column'}
      style={{
        borderRadius: 16,
        padding: '14px 18px',
        border: `1px solid ${theme.border}`,
        gap: 8,
        fontSize: 13,
      }}
    >
      <Row>
        <Label>
          <Trans>Current Market Price</Trans>
        </Label>
        <Value>
          <TradePrice price={marketPrice} style={{ color: theme.text }} />
        </Value>
      </Row>
    </Flex>
  )
}

const Header = ({ title, onDismiss }: { title: string; onDismiss: () => void }) => {
  const theme = useTheme()
  return (
    <Flex justifyContent={'space-between'}>
      <Flex color={theme.text} alignItems="center" style={{ gap: 8 }}>
        <Text fontSize={20}>{title}</Text>
      </Flex>
      <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.subText} />
    </Flex>
  )
}

const formatNumber = (uint256: string) => {
  return formatNumberWithPrecisionRange(parseFloat(uint256ToFraction(uint256).toFixed(16)), 2, 10)
}

const Note = ({ note }: { note?: string }) => {
  const theme = useTheme()
  return note ? (
    <Text fontSize={12} fontStyle="italic" color={theme.subText}>
      {note}
    </Text>
  ) : null
}

function ContentCancel({
  isCancelAll,
  order,
  marketPrice,
  onSubmit,
  onDismiss,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  marketPrice: Price<Currency, Currency> | undefined
  onSubmit: () => void
  onDismiss: () => void
}) {
  const theme = useTheme()
  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    filledTakingAmount,
    status,
  } = order ?? ({} as LimitOrder)
  const renderContentCancelAll = () => {
    return (
      <Label>
        <Trans>Are you sure you want to cancel all orders?</Trans>
      </Label>
    )
  }
  const listData = useMemo(() => {
    return !order
      ? []
      : [
          {
            label: t`I want to cancel my order where`,
            content: <Value></Value>,
          },
          {
            label: t`I pay`,
            content: (
              <Value>
                <Logo srcs={[makerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatNumber(makingAmount)} {makerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`and receive`,
            content: (
              <Value>
                <Logo srcs={[takerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatNumber(takingAmount)} {takerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`when`,
            content: <Rate order={order} />,
          },
        ]
  }, [makerAssetLogoURL, makerAssetSymbol, makingAmount, takerAssetLogoURL, takerAssetSymbol, takingAmount, order])
  return (
    <Container>
      <Header title={t`Cancel Order`} onDismiss={onDismiss} />
      {isCancelAll ? (
        renderContentCancelAll()
      ) : (
        <>
          <ListInfo listData={listData} />
          <MarketInfo marketPrice={marketPrice} />
        </>
      )}
      <Note
        note={t`Note: Cancelling an order will cost gas fees. ${
          status === LimitOrderStatus.PARTIALLY_FILLED
            ? `Your currently existing order is ${calcPercentFilledOrder(filledTakingAmount, takingAmount)}% filled`
            : null
        }`}
      />
      <ButtonError onClick={onSubmit} style={{ background: theme.red }}>
        <Trans>Cancel</Trans>
      </ButtonError>
    </Container>
  )
}

export default memo(function ConfirmOrderModal({
  onSubmit,
  currencyIn,
  currencyOut,
  onDismiss,
  flowState,
  outputAmount,
  inputAmount,
  expireAt,
  marketPrice,
  rateInfo,
  note,
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  expireAt: number
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
  note?: string
}) {
  const { account } = useActiveWeb3React()

  const listData = useMemo(() => {
    return [
      {
        label: t`I want to pay`,
        content: currencyIn && (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <Text>
              {formatValue(inputAmount)} {currencyIn?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`and receive at least`,
        content: currencyOut && (
          <Value>
            <CurrencyLogo currency={currencyOut} style={styleLogo} />
            <Text>
              {formatValue(outputAmount?.toString())} {currencyOut?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`when`,
        content: account && <Rate rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={currencyOut} />,
      },
      {
        label: t`before the order expires on`,
        content: account && (
          <Value>
            <Text>{dayjs(expireAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Value>
        ),
      },
    ]
  }, [account, currencyIn, currencyOut, inputAmount, rateInfo, outputAmount, expireAt])

  const confirmationContent = useCallback(() => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
          ) : (
            <Container>
              <Header title={t`Review your order`} onDismiss={onDismiss} />
              <ListInfo listData={listData} />
              <MarketInfo marketPrice={marketPrice} />
              <Note note={note} />
              <ButtonPrimary onClick={onSubmit}>
                <Trans>Place Order</Trans>
              </ButtonPrimary>
            </Container>
          )}
        </div>
      </Flex>
    )
  }, [onDismiss, flowState.errorMessage, listData, onSubmit, marketPrice, note])

  return (
    <TransactionConfirmationModal
      hash={flowState.txHash}
      isOpen={flowState.showConfirm}
      onDismiss={onDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={confirmationContent}
      pendingText={flowState.pendingText || t`Placing order`}
    />
  )
})

export function CancelOrderModal({
  onSubmit,
  onDismiss,
  flowState,
  order,
  isOpen,
  isCancelAll,
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  order?: LimitOrder
  isOpen: boolean
  isCancelAll: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
  const { tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)
  const confirmationContent = useCallback(
    () =>
      flowState.errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
      ) : (
        <ContentCancel
          onSubmit={onSubmit}
          onDismiss={onDismiss}
          marketPrice={tradeInfo?.price}
          isCancelAll={isCancelAll}
          order={order}
        />
      ),
    [onDismiss, flowState.errorMessage, onSubmit, order, tradeInfo?.price, isCancelAll],
  )
  return (
    <TransactionConfirmationModal
      hash={flowState.txHash}
      isOpen={flowState.showConfirm && isOpen}
      onDismiss={onDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={confirmationContent}
      pendingText={flowState.pendingText || t`Canceling order`}
    />
  )
}
