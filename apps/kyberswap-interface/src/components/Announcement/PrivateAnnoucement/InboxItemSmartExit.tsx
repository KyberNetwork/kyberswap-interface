import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Flex, Text } from 'rebass'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import InboxActions from 'components/Announcement/PrivateAnnoucement/InboxActions'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  StatusTitle,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateSmartExit } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { Exchange } from 'pages/Earns/constants'
import { getDexVersion } from 'pages/Earns/utils/position'

const InboxItemSmartExit = ({
  announcement,
  onRead,
  style,
  time,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplateSmartExit>) => {
  const theme = useTheme()
  const { templateBody, isRead, templateType } = announcement
  const { position, order, reason, received } = templateBody || {}

  const statusMessage = getStatusMessage(reason, received)

  const onClick = () => {
    onRead(announcement, statusMessage)
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
          <InboxIcon type={templateType} chainId={Number(position.chain.id) as ChainId} />
          <StatusTitle isRead={isRead}>{statusMessage}</StatusTitle>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>{time}</RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <DoubleCurrencyLogoV2
            style={{ marginRight: 10 }}
            logoUrl1={position.pool.token0.logo}
            logoUrl2={position.pool.token1.logo}
            size={16}
          />
          <PrimaryText style={{ fontSize: 14 }}>
            {position.pool.token0.symbol}/{position.pool.token1.symbol}
          </PrimaryText>

          <Flex alignItems="center" p="4px 8px" bg={rgba(theme.white, 0.05)} sx={{ gap: 1, borderRadius: 12 }}>
            <TokenLogo src={position.dex.logo} size={14} />
            <Text fontSize={12} color={theme.subText}>
              {getDexVersion(position.dex.type as Exchange)}
            </Text>
            <Text fontSize={12} color={theme.subText}>
              #{position.tokenId}
            </Text>
          </Flex>
        </Flex>
      </InboxItemRow>

      <RowItem>
        <Text fontSize={12} color={theme.subText}>
          {order.conditionText ? t`Cond:` : t`Reason:`}
        </Text>
        <PrimaryText>{order.conditionText || reason}</PrimaryText>
      </RowItem>
    </InboxItemWrapper>
  )
}

export default InboxItemSmartExit

const getStatusMessage = (reason?: string, received?: string) => {
  if (received) return t`Smart Exit executed`
  if (!reason) return t`Smart Exit created`
  const lower = reason.toLowerCase()
  if (lower.includes('executed')) return t`Smart Exit executed`
  if (lower.includes('expired') || lower.includes('expiry')) return t`Smart Exit expired`
  if (lower.includes('cancel')) return t`Smart Exit cancelled`
  if (lower.includes('max gas') || lower.includes('not executed') || lower.includes('retry')) {
    return t`Smart Exit not executed`
  }
  if (lower.includes('liquidity')) return t`Smart Exit cancelled`
  return t`Smart Exit updated`
}
