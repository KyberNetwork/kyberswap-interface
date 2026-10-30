import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { Desc, Time, Title, Wrapper } from 'components/Announcement/PrivateAnnoucement/NotificationCenter/styled'
import { AnnouncementTemplateLimitOrder } from 'components/Announcement/type'
import { useOrderListNavigation } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import Logo from 'components/Logo'
import { formatTime } from 'utils/time'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateLimitOrder>) {
  const { sentAt, templateType, templateBody } = announcement
  const {
    status,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    takingAmountRate,
    filledPercent,
    increasedFilledPercent,
    chainId: rawChainId,
    takerAssetLogoURL,
  } = templateBody?.order || {}
  const isReorg = templateBody.isReorg
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const chainId = rawChainId && rawChainId !== '{{.chainId}}' ? (Number(rawChainId) as ChainId) : undefined

  const statusMessage = isReorg ? (
    <span className="text-red">
      <Trans>reverted {increasedFilledPercent}</Trans>
    </span>
  ) : isFilled ? (
    <span className="text-primary">
      <Trans>successfully filled</Trans>
    </span>
  ) : isPartialFilled ? (
    <span className="text-warning">
      <Trans>partially filled ({filledPercent})</Trans>
    </span>
  ) : (
    <span className="text-warning">
      <Trans>expired ({filledPercent}% filled)</Trans>
    </span>
  )

  const navigateToOrders = useOrderListNavigation()
  const onClick = () => {
    const orderTab =
      isFilled || isPartialFilled || status === LimitOrderStatus.CANCELLED || status === LimitOrderStatus.EXPIRED
        ? LimitOrderStatus.CLOSED
        : LimitOrderStatus.ACTIVE
    navigateToOrders({ kind: OrderKind.LIMIT, status: orderTab, chainId })
  }
  return (
    <Wrapper onClick={onClick}>
      <div className="flex w-full justify-between">
        <Title>
          <InboxIcon type={templateType} chainId={chainId} />
          {title}
        </Title>
        <div className="flex items-center">
          <Time>{formatTime(sentAt)} </Time>
        </div>
      </div>
      <Desc>
        <Trans>
          Your order to pay <Logo srcs={[makerAssetLogoURL]} className="size-4 rounded-full" /> {makingAmount}{' '}
          {makerAssetSymbol} and receive <Logo srcs={[takerAssetLogoURL]} className="size-4 rounded-full" />{' '}
          {takingAmount} {takerAssetSymbol} when <span>1 {makerAssetSymbol} is equal to </span>
          <span>
            {takingAmountRate} {takerAssetSymbol}
          </span>{' '}
          was {statusMessage}
        </Trans>
      </Desc>
    </Wrapper>
  )
}
