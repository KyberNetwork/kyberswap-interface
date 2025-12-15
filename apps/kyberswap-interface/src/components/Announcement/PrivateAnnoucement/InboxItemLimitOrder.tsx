import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ArrowRight, Repeat, XCircle } from 'react-feather'

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
import { AnnouncementTemplateLimitOrder } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import { TokenLogoWithShadow } from 'components/Logo'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { useNavigateToUrl } from 'utils/redirect'

function InboxItemLimitOrder({
  announcement,
  onRead,
  style,
  time,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplateLimitOrder>) {
  const { templateBody, isRead, templateType } = announcement
  const theme = useTheme()
  const {
    status,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    takerAssetLogoURL,
    filledMakingAmount,
    makingAmount,
    takingAmount,
    filledPercent,
    increasedFilledPercent,
    takingAmountRate,
    chainId: rawChainId,
    expiredAt,
    requiredMakingAmount,
    availableMakingAmount,
  } = templateBody?.order || {}
  const isReorg = templateBody?.isReorg

  const chainId = Number(rawChainId) as ChainId
  const isFilled = status === LimitOrderStatus.FILLED
  const isPartialFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const isCancelled = status === LimitOrderStatus.CANCELLED || status === LimitOrderStatus.CLOSED
  const isInsufficient = status === 'insufficient_funds'
  const formatExpiryTime = (value?: number | string) => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'string' && value.includes('{{')) return undefined
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) return undefined
    const date = numericValue > 1e12 ? dayjs(numericValue) : dayjs.unix(numericValue)
    return date.isValid() ? date.format('h:mma DD/MM/YYYY') : undefined
  }
  const expiredAtLabel = formatExpiryTime(expiredAt)

  const statusMeta = (() => {
    if (isReorg) {
      return {
        label: t`Order Reverted`,
        color: theme.red,
        icon: <XCircle color={theme.red} size={14} />,
        message: increasedFilledPercent ? t`Reverted ${increasedFilledPercent}` : t`Order Reverted`,
      }
    }
    const filledPercentLabel = filledPercent || '0%'
    switch (status) {
      case LimitOrderStatus.FILLED:
        return {
          label: t`Order Filled`,
          color: theme.primary,
          icon: <CheckCircle size="14" color={theme.primary} />,
          message: t`100% Filled`,
        }
      case LimitOrderStatus.PARTIALLY_FILLED:
        return {
          label: t`Order Partially Filled`,
          color: theme.warning,
          icon: <Repeat color={theme.warning} size={14} />,
          message: increasedFilledPercent
            ? t`${filledPercentLabel} Filled ${increasedFilledPercent}`
            : t`${filledPercentLabel} Filled`,
        }
      case LimitOrderStatus.EXPIRED:
        return {
          label: t`Order Expired`,
          color: theme.subText,
          icon: <XCircle color={theme.subText} size={14} />,
          message: filledPercent ? t`${filledPercent}% Filled | Expired` : t`Expired`,
        }
      case LimitOrderStatus.CANCELLING:
        return {
          label: t`Cancelling Order`,
          color: theme.warning,
          icon: <Repeat color={theme.warning} size={14} />,
          message: t`Cancelling Order`,
        }
      case LimitOrderStatus.CANCELLED:
      case LimitOrderStatus.CLOSED:
        return {
          label: t`Order Cancelled`,
          color: theme.subText,
          icon: <XCircle color={theme.subText} size={14} />,
          message: t`Order Cancelled`,
        }
      case 'insufficient_funds':
        return {
          label: t`Insufficient Funds`,
          color: theme.warning,
          icon: <XCircle color={theme.warning} size={14} />,
          message: t`Insufficient Funds`,
        }
      default:
        return {
          label: t`Order Created`,
          color: isRead ? theme.text : theme.primary,
          icon: <CheckCircle size="14" color={isRead ? theme.text : theme.primary} />,
          message: t`Order Created`,
        }
    }
  })()
  const statusMessage = statusMeta.message || statusMeta.label

  const navigate = useNavigateToUrl()
  const onClick = () => {
    const route = NETWORKS_INFO[chainId]?.route ?? NETWORKS_INFO[ChainId.MAINNET].route
    navigate(`${APP_PATHS.LIMIT}/${route}?activeTab=my_order`, chainId)
    onRead(announcement, statusMessage)
  }

  const hasAmounts = makerAssetSymbol && takerAssetSymbol && makingAmount && takingAmount
  const finalFill = makingAmount
    ? `${isFilled ? makingAmount : filledMakingAmount || '0'}/${makingAmount} ${makerAssetSymbol}`
    : undefined
  const priceText =
    takerAssetSymbol && makerAssetSymbol && takingAmountRate
      ? `${takingAmountRate} ${takerAssetSymbol}/${makerAssetSymbol}`
      : undefined

  const detailItems: { label: string; value?: string }[] = []
  if ((isFilled || isPartialFilled || isCancelled || status === LimitOrderStatus.EXPIRED) && finalFill) {
    detailItems.push({ label: t`Final fill:`, value: finalFill })
  }
  if (isInsufficient && makerAssetSymbol) {
    if (requiredMakingAmount) {
      detailItems.push({ label: t`Required:`, value: `${requiredMakingAmount} ${makerAssetSymbol}` })
    }
    if (availableMakingAmount) {
      detailItems.push({ label: t`Available:`, value: `${availableMakingAmount} ${makerAssetSymbol}` })
    }
  }
  if (priceText) {
    detailItems.push({ label: t`Price:`, value: priceText })
  }
  if (status === LimitOrderStatus.EXPIRED && expiredAtLabel) {
    detailItems.push({ label: t`Expired time:`, value: expiredAtLabel })
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
          <StatusTitle isRead={isRead} $color={statusMeta.color}>
            {statusMeta.icon}
            {statusMeta.label}
          </StatusTitle>
          {!isRead && <Dot />}
        </RowItem>
      </InboxItemRow>

      {hasAmounts ? (
        <AmountRow>
          <AmountItem>
            {makerAssetLogoURL && <TokenLogoWithShadow size="16px" srcs={[makerAssetLogoURL]} />}
            <span>
              {makingAmount} {makerAssetSymbol}
            </span>
          </AmountItem>
          <ArrowRight size={14} color={theme.subText} />
          <AmountItem>
            {takerAssetLogoURL && <TokenLogoWithShadow size="16px" srcs={[takerAssetLogoURL]} />}
            <span>
              {takingAmount} {takerAssetSymbol}
            </span>
          </AmountItem>
        </AmountRow>
      ) : null}

      {detailItems.length ? (
        <DetailList>
          {detailItems.map(item => (
            <DetailItem key={item.label}>
              {item.label} {item.value ? <DetailValue>{item.value}</DetailValue> : null}
            </DetailItem>
          ))}
        </DetailList>
      ) : null}

      <MetaRow>
        {expiredAtLabel && status !== LimitOrderStatus.EXPIRED ? (
          <DetailItem style={{ padding: 0 }}>
            {t`Expire time:`} <DetailValue>{expiredAtLabel}</DetailValue>
          </DetailItem>
        ) : (
          <span />
        )}
        {time}
      </MetaRow>
    </InboxItemWrapper>
  )
}
export default InboxItemLimitOrder
