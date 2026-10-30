import { Trans } from '@lingui/macro'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { Desc, Time, Title, Wrapper } from 'components/Announcement/PrivateAnnoucement/NotificationCenter/styled'
import { getStopMarketExecution } from 'components/Announcement/helpers'
import { AnnouncementTemplateStopMarket } from 'components/Announcement/type'
import { useOrderListNavigation } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import Logo from 'components/Logo'
import { formatDisplayNumber } from 'utils/numbers'
import { formatTime } from 'utils/time'

/** A stop market order that executed, as the notification center lists it beside limit orders. */
export default function StopMarketAnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateStopMarket>) {
  const { sentAt, templateType } = announcement
  const { chainId, tokenInSymbol, tokenInLogoURL, amountIn, tokenOutSymbol, tokenOutLogoURL, amountOut } =
    getStopMarketExecution(announcement) ?? {}

  const navigateToOrders = useOrderListNavigation()
  const onClick = () => {
    navigateToOrders({ kind: OrderKind.STOP, status: LimitOrderStatus.CLOSED, chainId })
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
          Your Stop Market order sold <Logo srcs={[tokenInLogoURL ?? '']} className="size-4 rounded-full" />{' '}
          {formatDisplayNumber(amountIn, { significantDigits: 6 })} {tokenInSymbol} and received{' '}
          <Logo srcs={[tokenOutLogoURL ?? '']} className="size-4 rounded-full" />{' '}
          {formatDisplayNumber(amountOut, { significantDigits: 6 })} {tokenOutSymbol}.
        </Trans>
      </Desc>
    </Wrapper>
  )
}
