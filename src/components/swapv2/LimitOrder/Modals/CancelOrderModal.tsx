import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import Logo from 'components/Logo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
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

const styleLogo = { width: 20, height: 20 }
function ContentCancel({
  isCancelAll,
  order,
  marketPrice,
  onSubmit,
  onDismiss,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  marketPrice: BaseTradeInfo | undefined
  onSubmit: (cancelType: CancelOrderType) => void
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
    makerAssetDecimals,
    takerAssetDecimals,
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
  return (
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
      {/** // todo */}
      <ButtonWrapper>
        <Column width={'100%'} gap="8px">
          <ButtonLight onClick={() => onSubmit(CancelOrderType.GAS_LESS_CANCEL)} height={'40px'} width={'100%'}>
            <GasLessIcon />
            <Trans>Cancel (gasless)</Trans>
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
            onClick={() => onSubmit(CancelOrderType.HARD_CANCEL)}
            style={{ color: theme.red, background: rgba(theme.red, 0.2), height: '40px', width: '100%' }}
          >
            <GasStation size={20} />
            <Trans>Hard Cancel</Trans>
          </ButtonLight>
          <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
            <Trans>
              Cancel immediately by paying gas fees. <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
            </Trans>
          </Text>
        </Column>
      </ButtonWrapper>
    </Container>
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
  onSubmit: (cancelType: CancelOrderType) => void
  onDismiss: () => void
  flowState: TransactionFlowState
  order?: LimitOrder
  isOpen: boolean
  isCancelAll: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut)
  const confirmationContent = useCallback(
    () =>
      flowState.errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
      ) : (
        <ContentCancel
          onSubmit={onSubmit}
          onDismiss={onDismiss}
          marketPrice={tradeInfo}
          isCancelAll={isCancelAll}
          order={order}
        />
      ),
    [onDismiss, flowState.errorMessage, onSubmit, order, tradeInfo, isCancelAll],
  )
  return (
    <TransactionConfirmationModal
      maxWidth={480}
      hash={flowState.txHash}
      isOpen={flowState.showConfirm && isOpen}
      onDismiss={onDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={confirmationContent}
      pendingText={flowState.pendingText || t`Canceling order`}
    />
  )
}
