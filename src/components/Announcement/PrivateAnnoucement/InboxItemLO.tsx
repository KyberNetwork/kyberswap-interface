import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import {
  Dot,
  InboxItemRow,
  InboxItemTime,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateLimitOrder, PrivateAnnouncement } from 'components/Announcement/type'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { formatStatusLimitOrder } from 'components/swapv2/LimitOrder/ListOrder/OrderItem'
import { formatAmountOrder, formatRateLimitOrder } from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'

function InboxItemBridge({ announcement, onRead }: { announcement: PrivateAnnouncement; onRead: () => void }) {
  const { templateBody } = announcement
  const order = ((templateBody as AnnouncementTemplateLimitOrder).order ?? {}) as LimitOrder
  const {
    status,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    takerAssetLogoURL,
    filledMakingAmount,
    makingAmount,
    takingAmount,
    filledTakingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order as LimitOrder
  const isRead = Math.random() < 0.5
  const isSuccess = status === LimitOrderStatus.FILLED
  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.LIMIT)
    onRead()
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick}>
      <InboxItemRow>
        <RowItem>
          <LimitOrderIcon />
          <Title isRead={isRead}>
            <Trans>Limit Order</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{formatStatusLimitOrder(order)}</PrimaryText>
          <img height={12} width={12} src={isSuccess ? IconSuccess : IconFailure} alt="icon-status" />
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <InboxItemTime>
          <DeltaTokenAmount
            plus
            amount={`${formatAmountOrder(filledTakingAmount, takerAssetDecimals)}/${formatAmountOrder(
              takingAmount,
              takerAssetDecimals,
            )}`}
            symbol={takerAssetSymbol}
            logoURL={takerAssetLogoURL}
          />
        </InboxItemTime>
        <PrimaryText>
          {formatRateLimitOrder(order, false)} {makerAssetSymbol}/{takerAssetSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <DeltaTokenAmount
          plus={false}
          amount={`${formatAmountOrder(filledMakingAmount, makerAssetDecimals)}/${formatAmountOrder(
            makingAmount,
            makerAssetDecimals,
          )}`}
          symbol={makerAssetSymbol}
          logoURL={makerAssetLogoURL}
        />
        <InboxItemTime>12/12/2002</InboxItemTime>
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
