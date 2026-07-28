import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ArrowDown, ArrowUp, Repeat } from 'react-feather'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import InboxActions from 'components/Announcement/PrivateAnnoucement/InboxActions'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePriceAlert } from 'components/Announcement/type'
import { ButtonLight } from 'components/Button'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { HistoricalPriceAlert, PriceAlertType } from 'pages/NotificationCenter/const'
import { cn } from 'utils/cn'
import { useNavigateToUrl } from 'utils/redirect'

export const getSwapUrlPriceAlert = (alert: HistoricalPriceAlert) => {
  const { swapURL } = alert
  try {
    const { pathname, search } = new URL(swapURL)
    return `${pathname}${search}`
  } catch (error) {
    return swapURL
  }
}

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplatePriceAlert>) {
  const { templateBody, isRead, templateType } = announcement

  const {
    tokenInLogoURL,
    tokenOutLogoURL,
    tokenOutSymbol,
    tokenInSymbol,
    type,
    chainId: rawChainId,
    tokenInAmount,
    threshold,
  } = templateBody?.alert || {}
  const chainId = Number(rawChainId) as ChainId

  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(getSwapUrlPriceAlert(templateBody.alert), chainId)
    onRead(announcement, 'price_alert')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxActions
        isPinned={announcement.isPinned}
        onPin={onPin ? () => onPin(announcement) : undefined}
        onDelete={onDelete ? () => onDelete(announcement) : undefined}
      />
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} chainId={chainId} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <ButtonLight height={'24px'} className="gap-1.5 px-2.5 py-3">
            <Repeat size={16} /> <Trans>Swap</Trans>
          </ButtonLight>
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <div className="flex items-center gap-1">
          <DeltaTokenAmount
            className="text-text"
            amount={tokenInAmount}
            symbol={tokenInSymbol}
            logoURL={tokenInLogoURL}
          />
          <span className="text-subText">
            <Trans>to</Trans>
          </span>
          <DeltaTokenAmount className="text-text" amount={<div />} symbol={tokenOutSymbol} logoURL={tokenOutLogoURL} />
        </div>
      </InboxItemRow>

      <InboxItemRow>
        <div className="flex items-center gap-1">
          <div className={cn('flex items-center gap-1', type === PriceAlertType.ABOVE ? 'text-primary' : 'text-red')}>
            {type === PriceAlertType.ABOVE ? <ArrowUp size={16} /> : <ArrowDown size={16} />} {type}
          </div>
          {threshold} {tokenOutSymbol}
        </div>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
