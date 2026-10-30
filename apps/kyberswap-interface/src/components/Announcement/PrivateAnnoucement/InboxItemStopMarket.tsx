import { t } from '@lingui/macro'
import { ArrowRight } from 'react-feather'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import InboxActions from 'components/Announcement/PrivateAnnoucement/InboxActions'
import {
  AmountItem,
  AmountRow,
  DetailItem,
  DetailList,
  DetailValue,
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  MetaRow,
  RowItem,
  StatusTitle,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { getStopMarketExecution } from 'components/Announcement/helpers'
import { AnnouncementTemplateStopMarket } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import { useOrderListNavigation } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import { TokenLogoWithShadow } from 'components/Logo'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const formatAmount = (value?: string) => formatDisplayNumber(value, { significantDigits: 6 })

/** A stop market order that executed, as the limit order notifications list shows it. */
function InboxItemStopMarket({
  announcement,
  onRead,
  style,
  time,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplateStopMarket>) {
  const { isRead, templateType } = announcement
  const {
    chainId,
    txHash,
    tokenInSymbol,
    tokenInLogoURL,
    amountIn,
    tokenOutSymbol,
    tokenOutLogoURL,
    amountOut,
    triggerPrice,
    executedPrice,
  } = getStopMarketExecution(announcement) ?? {}
  const statusLabel = t`Stop Market Executed`

  const navigateToOrders = useOrderListNavigation()
  const onClick = () => {
    navigateToOrders({ kind: OrderKind.STOP, status: LimitOrderStatus.CLOSED, chainId })
    onRead(announcement, statusLabel)
  }

  const pairUnit = tokenInSymbol && tokenOutSymbol ? `${tokenOutSymbol}/${tokenInSymbol}` : undefined
  const detailItems: { label: string; value: string }[] = []
  if (triggerPrice && pairUnit) {
    detailItems.push({ label: t`Trigger price:`, value: `${formatAmount(triggerPrice)} ${pairUnit}` })
  }
  if (executedPrice && pairUnit) {
    detailItems.push({ label: t`Executed price:`, value: `${formatAmount(executedPrice)} ${pairUnit}` })
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
          <StatusTitle isRead={isRead} className={isRead ? 'text-text' : 'text-primary'}>
            <CheckCircle size="14" className={isRead ? 'text-text' : 'text-primary'} />
            {statusLabel}
          </StatusTitle>
          {!isRead && <Dot />}
        </RowItem>
      </InboxItemRow>

      {amountIn && tokenInSymbol && amountOut && tokenOutSymbol ? (
        <AmountRow>
          <AmountItem>
            {tokenInLogoURL && <TokenLogoWithShadow size="16px" srcs={[tokenInLogoURL]} />}
            <span>
              {formatAmount(amountIn)} {tokenInSymbol}
            </span>
          </AmountItem>
          <ArrowRight size={14} className="text-subText" />
          <AmountItem>
            {tokenOutLogoURL && <TokenLogoWithShadow size="16px" srcs={[tokenOutLogoURL]} />}
            <span>
              {formatAmount(amountOut)} {tokenOutSymbol}
            </span>
          </AmountItem>
        </AmountRow>
      ) : null}

      {detailItems.length ? (
        <DetailList>
          {detailItems.map(item => (
            <DetailItem key={item.label}>
              {item.label} <DetailValue>{item.value}</DetailValue>
            </DetailItem>
          ))}
        </DetailList>
      ) : null}

      <MetaRow>
        {chainId && txHash ? (
          <ExternalLink
            href={getEtherscanLink(chainId, txHash, 'transaction')}
            onClick={event => event.stopPropagation()}
            className="text-xs"
          >
            {t`View tx`} ↗
          </ExternalLink>
        ) : (
          <span />
        )}
        {time}
      </MetaRow>
    </InboxItemWrapper>
  )
}

export default InboxItemStopMarket
