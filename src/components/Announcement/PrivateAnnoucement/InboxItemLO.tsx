import { Trans, t } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { ReactComponent as IconSuccess } from 'assets/svg/notification_icon_success.svg'
import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateLimitOrder, LimitOrderNotification } from 'components/Announcement/type'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const StyledIconSuccess = styled(IconSuccess)`
  path {
    fill: ${({ theme }) => theme.warning};
  } // todo
`
function InboxItemBridge({ announcement, onRead, style, time }: PrivateAnnouncementProp) {
  const { templateBody, isRead } = announcement
  const theme = useTheme()
  const order = ((templateBody as AnnouncementTemplateLimitOrder).order ?? {}) as LimitOrderNotification
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
    filledPercent,
    increasedFilledPercent,
    takingAmountRate,
  } = order
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  isFilled && console.log(order)

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.LIMIT)
    onRead()
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <LimitOrderIcon />
          <Title isRead={isRead}>
            <Trans>Limit Order</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>
            {isFilled
              ? t`100% Filled`
              : isPartialFilled
              ? t`${filledPercent} Filled ${increasedFilledPercent}`
              : `${filledPercent}% Filled | Expired`}
          </PrimaryText>
          {isFilled ? (
            <IconSuccess width={12} height={12} />
          ) : isPartialFilled ? (
            <Repeat color={theme.warning} size={12} />
          ) : (
            <StyledIconSuccess width={12} height={12} />
          )}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <DeltaTokenAmount
          plus
          amount={`${filledTakingAmount}/${takingAmount}`}
          symbol={takerAssetSymbol}
          logoURL={takerAssetLogoURL}
        />
        <PrimaryText>
          {takingAmountRate} {makerAssetSymbol}/{takerAssetSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <DeltaTokenAmount
          plus={false}
          amount={`${filledMakingAmount}/${makingAmount}`}
          symbol={makerAssetSymbol}
          logoURL={makerAssetLogoURL}
        />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
