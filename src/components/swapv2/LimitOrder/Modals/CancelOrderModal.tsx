import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import WarningIcon from 'components/Icons/WarningIcon'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import CancelCountDown, { CountDownWrapper } from 'components/swapv2/LimitOrder/Modals/CancelCountDown'
import useFetchActiveAllOrders from 'components/swapv2/LimitOrder/useFetchActiveAllOrders'
import { useCurrencyV2 } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'

import { BaseTradeInfo, useBaseTradeInfoLimitOrder } from '../../../../hooks/useBaseTradeInfo'
import { calcPercentFilledOrder, formatAmountOrder } from '../helpers'
import { CancelOrderType, LimitOrder, LimitOrderStatus } from '../type'
import { Container, Header, Label, ListInfo, MarketInfo, Note, Rate, Value } from './styled'

const ButtonWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

export enum CancelStatus {
  WAITING,
  COUNTDOWN,
  TIMEOUT,
  CANCEL_DONE,
}

const styleLogo = { width: 20, height: 20 }
function ContentCancel({
  isCancelAll,
  order,
  marketPrice,
  onSubmit,
  onDismiss,
  flowState,
  isOpen,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  marketPrice: BaseTradeInfo | undefined
  onSubmit: (orders: LimitOrder[], cancelType: CancelOrderType) => void
  onDismiss: () => void
  flowState: TransactionFlowState
  isOpen: boolean
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
    makerAssetDecimals,
    takerAssetDecimals,
  } = order ?? ({} as LimitOrder)
  const { attemptingTxn, errorMessage } = flowState
  const pendingText = flowState.pendingText || t`Canceling order`

  const [expiredTime, setExpiredTime] = useState(0)
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const { orders = [], ordersSoftCancel = [], supportCancelGasless } = useFetchActiveAllOrders(false && !isCancelAll)
  const requestCancel = async (type: CancelOrderType) => {
    const gasLessCancel = type === CancelOrderType.GAS_LESS_CANCEL
    const data: any = await onSubmit(
      isCancelAll ? (gasLessCancel ? ordersSoftCancel : orders) : order ? [order] : [],
      type,
    ) // todo
    if (gasLessCancel) setCancelStatus(CancelStatus.COUNTDOWN)
    const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
    expired && setExpiredTime(expired)
  }

  const onClickGaslessCancel = () => !isCountDown && requestCancel(CancelOrderType.GAS_LESS_CANCEL)

  const isWaiting = cancelStatus === CancelStatus.WAITING
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isTimeout = cancelStatus === CancelStatus.TIMEOUT
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  const renderContentCancelAll = () => {
    return (
      <Label>
        <Trans>Are you sure you want to cancel {orders.length} limit orders?</Trans>
      </Label>
    )
  }
  const listData = useMemo(() => {
    return !order
      ? []
      : [
          {
            label: t`I want to cancel my order where`,
            content: <Value />,
          },
          {
            label: t`I pay`,
            content: (
              <Value>
                <Logo srcs={[makerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
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
                  {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`at`,
            content: <Rate order={order} />,
          },
        ]
  }, [
    makerAssetLogoURL,
    makerAssetSymbol,
    makingAmount,
    takerAssetLogoURL,
    takerAssetSymbol,
    takingAmount,
    order,
    makerAssetDecimals,
    takerAssetDecimals,
  ])

  const renderButtons = () => {
    return (
      <ButtonWrapper style={{ justifyContent: isTimeout ? 'flex-end' : undefined }}>
        {isCancelDone ? (
          <ButtonLight onClick={onDismiss} height={'40px'} width={'100%'}>
            <Check size={18} /> &nbsp;<Trans>Okay</Trans>
          </ButtonLight>
        ) : isTimeout ? (
          <ButtonLight onClick={onClickGaslessCancel} height={'40px'} width={'100px'}>
            <Trans>Try Again</Trans>
          </ButtonLight>
        ) : (
          <>
            <Column width={'100%'} gap="8px">
              <ButtonLight
                disabled={isCountDown ? false : !supportCancelGasless || attemptingTxn}
                onClick={onClickGaslessCancel}
                height={'40px'}
                width={'100%'}
              >
                {isCountDown ? <Check size={18} /> : <GasLessIcon />}
                &nbsp;
                {isCountDown ? (
                  <Trans>Okay</Trans>
                ) : isCancelAll ? (
                  <Trans>
                    Cancel (gasless){' '}
                    {ordersSoftCancel.length === orders.length || !supportCancelGasless
                      ? 'all'
                      : `${ordersSoftCancel.length}/${orders.length}`}{' '}
                    orders{' '}
                  </Trans>
                ) : (
                  <Trans>Cancel (gasless)</Trans>
                )}
              </ButtonLight>
              <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
                <Trans>
                  Cancel without paying gas.
                  <br /> Cancellation may not be instant. <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
                </Trans>
              </Text>
            </Column>
            <Column width={'100%'} gap="8px">
              <ButtonLight
                disabled={attemptingTxn}
                onClick={() => requestCancel(CancelOrderType.HARD_CANCEL)}
                style={{ color: theme.red, backgroundColor: rgba(theme.red, 0.2), height: '40px', width: '100%' }}
              >
                <GasStation size={20} />
                &nbsp;
                {isCountDown ? (
                  <Trans>Hard Cancel Instead</Trans>
                ) : isCancelAll ? (
                  <Trans>Hard Cancel all orders</Trans>
                ) : (
                  <Trans>Hard Cancel</Trans>
                )}
              </ButtonLight>
              <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
                <Trans>
                  Cancel immediately by paying gas fees. <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
                </Trans>
              </Text>
            </Column>
          </>
        )}
      </ButtonWrapper>
    )
  }
  return (
    <Modal
      maxWidth={isCancelAll && !isCancelDone ? 600 : 480}
      isOpen={flowState.showConfirm && isOpen}
      onDismiss={onDismiss}
    >
      <Container>
        <Header title={isCancelAll ? t`Bulk Cancellation` : t`Cancel an order`} onDismiss={onDismiss} />
        {isCancelAll ? (
          renderContentCancelAll()
        ) : (
          <>
            <ListInfo listData={listData} />
            <MarketInfo marketPrice={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />
          </>
        )}
        <Note
          note={
            status === LimitOrderStatus.PARTIALLY_FILLED
              ? t`Note: Your currently existing order is ${calcPercentFilledOrder(
                  filledTakingAmount,
                  takingAmount,
                  takerAssetDecimals,
                )}% filled`
              : ''
          }
        />

        {attemptingTxn || errorMessage ? (
          <CountDownWrapper style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {errorMessage ? (
              <>
                <WarningIcon color={theme.red} />
                <Text fontSize={'14px'} color={theme.red}>
                  {errorMessage}
                </Text>
              </>
            ) : (
              <>
                <Loader /> <Text fontSize={'14px'}>{pendingText}</Text>
              </>
            )}
          </CountDownWrapper>
        ) : (
          !isWaiting && (
            <CancelCountDown expiredTime={expiredTime} cancelStatus={cancelStatus} setCancelStatus={setCancelStatus} />
          )
        )}
        {/** // todo */}
        {renderButtons()}
      </Container>
    </Modal>
  )
}

export default function CancelOrderModal({
  onSubmit,
  onDismiss,
  flowState,
  order,
  isOpen,
  isCancelAll,
}: {
  onSubmit: (orders: LimitOrder[], cancelType: CancelOrderType) => void
  onDismiss: () => void
  flowState: TransactionFlowState
  order?: LimitOrder
  isOpen: boolean
  isCancelAll: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut)

  return (
    <ContentCancel
      isOpen={isOpen}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
      marketPrice={tradeInfo}
      isCancelAll={isCancelAll}
      order={order}
      flowState={flowState}
    />
  )
}
