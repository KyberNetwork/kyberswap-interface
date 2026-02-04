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
import {
  getSmartExitConditionText,
  getSmartExitReasonText,
  getSmartExitStatusFromTemplateId,
  getSmartExitStatusMessage,
} from 'components/Announcement/helpers'
import { AnnouncementTemplateSmartExit } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { EARN_DEXES, SMART_EXIT_DEX_TYPE_TO_EXCHANGE } from 'pages/Earns/constants'
import { getDexVersion } from 'pages/Earns/utils/position'
import { formatDisplayNumber } from 'utils/numbers'
import { useNavigateToUrl } from 'utils/redirect'

const InboxItemSmartExit = ({
  announcement,
  onRead,
  style,
  time,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplateSmartExit>) => {
  const theme = useTheme()
  const navigate = useNavigateToUrl()
  const { templateBody, isRead, templateType } = announcement
  const { position, order, reason } = templateBody || {}

  if (!position || !order) return null

  const orderStatus = getSmartExitStatusFromTemplateId(announcement.templateId)
  const statusMessage = getSmartExitStatusMessage(orderStatus)
  const conditionText = getSmartExitConditionText(order.condition)
  const reasonText = getSmartExitReasonText(reason, orderStatus)
  const receivedText = getReceivedText(order.execution, position.pool.token0.symbol, position.pool.token1.symbol)

  const exchange = SMART_EXIT_DEX_TYPE_TO_EXCHANGE[position.dex.type]
  const dexInfo = EARN_DEXES[exchange]
  const dexVersion = getDexVersion(exchange)

  const onClick = () => {
    navigate(`${APP_PATHS.EARN_SMART_EXIT}?orderId=${order.id}`)
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
            <TokenLogo src={dexInfo.logo} size={14} />
            <Text fontSize={12} color={theme.subText}>
              {dexVersion}
            </Text>
            <Text fontSize={12} color={theme.subText}>
              #{position.tokenId}
            </Text>
          </Flex>
        </Flex>
      </InboxItemRow>

      {conditionText ? (
        <RowItem>
          <Text fontSize={12} color={theme.subText}>
            {t`Cond:`}
          </Text>
          <PrimaryText>{conditionText}</PrimaryText>
        </RowItem>
      ) : null}
      {reasonText ? (
        <RowItem>
          <Text fontSize={12} color={theme.subText}>
            {t`Reason:`}
          </Text>
          <PrimaryText>{reasonText}</PrimaryText>
        </RowItem>
      ) : null}
      {receivedText ? (
        <RowItem>
          <Text fontSize={12} color={theme.subText}>
            {t`Received:`}
          </Text>
          <PrimaryText>{receivedText}</PrimaryText>
        </RowItem>
      ) : null}
    </InboxItemWrapper>
  )
}

export default InboxItemSmartExit

const getReceivedText = (
  execution?: { receivedAmount0?: string; receivedAmount1?: string },
  token0Symbol?: string,
  token1Symbol?: string,
) => {
  const parts: string[] = []
  if (execution?.receivedAmount0 && token0Symbol) {
    parts.push(`${formatDisplayNumber(execution.receivedAmount0, { significantDigits: 6 })} ${token0Symbol}`)
  }
  if (execution?.receivedAmount1 && token1Symbol) {
    parts.push(`${formatDisplayNumber(execution.receivedAmount1, { significantDigits: 6 })} ${token1Symbol}`)
  }
  if (parts.length) return parts.join(' + ')
  return undefined
}
