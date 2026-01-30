import { formatCurrency } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
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
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import {
  AnnouncementTemplatePoolPosition,
  PoolPositionAnnouncement,
  PoolPositionLiquidityAnnouncement,
} from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { getDexVersion, getTokenId } from 'pages/Earns/utils/position'

enum Status {
  NEW,
  ADD,
  FULL_REMOVE,
  PARTIAL_REMOVE,
  IN_RANGE,
  OUT_RANGE,
}

const InboxItemEarnPosition = ({
  announcement,
  onRead,
  style,
  time,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplatePoolPosition>) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const { isRead, templateType, templateBody } = announcement
  const position = normalizePosition(templateBody.position) || {}

  const {
    positionId,
    chainId: rawChain,
    token0Symbol,
    token1Symbol,
    token0LogoURL,
    token1LogoURL,
    currentPrice,
    minPrice,
    maxPrice,
    exchange,
    notificationType,
    oldValueUsd,
    newValueUsd,
  } = position

  const chainId = Number(rawChain) as ChainId

  const [statusMessage, status] = useMemo(() => {
    if (!notificationType) {
      const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice
      return isInRange ? [t`Position Back in range`, Status.IN_RANGE] : [t`Position Out of range`, Status.OUT_RANGE]
    }
    if (notificationType === 'CREATED' || oldValueUsd === 0) return [t`Position Created`, Status.NEW]
    if (notificationType === 'LIQUIDITY_INCREASED' || newValueUsd > oldValueUsd)
      return [t`Position Increased`, Status.ADD]
    if (notificationType === 'LIQUIDITY_DECREASED' || newValueUsd < oldValueUsd) {
      return newValueUsd === 0
        ? [t`Position Removed`, Status.FULL_REMOVE]
        : [t`Position Partially Removed`, Status.PARTIAL_REMOVE]
    }
    return [t`Position Updated`, Status.NEW]
  }, [notificationType, currentPrice, minPrice, maxPrice, oldValueUsd, newValueUsd])

  const dex = useMemo(() => {
    return {
      id: exchange,
      name: EARN_DEXES[exchange].name,
      logo: EARN_DEXES[exchange].logo,
      version: getDexVersion(exchange as Exchange),
    }
  }, [exchange])

  const tokenId = getTokenId(positionId)

  const onClick = () => {
    const positionUrl = APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', positionId)
      .replace(':chainId', rawChain)
      .replace(':exchange', exchange)
    navigate(positionUrl)
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
          <InboxIcon type={templateType} chainId={chainId} />
          <Title isRead={isRead}>{statusMessage}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>{time}</RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <DoubleCurrencyLogoV2
            style={{ marginRight: 10 }}
            logoUrl1={token0LogoURL}
            logoUrl2={token1LogoURL}
            size={16}
          />
          <PrimaryText style={{ fontSize: 14 }}>
            {token0Symbol}/{token1Symbol}
          </PrimaryText>

          <Flex alignItems="center" p="4px 8px" bg={rgba(theme.white, 0.05)} sx={{ gap: 1, borderRadius: 12 }}>
            <TokenLogo src={dex.logo} size={14} />
            <Text fontSize={12} color={theme.subText}>
              {dex.version}
            </Text>
            {tokenId && (
              <Text fontSize={12} color={theme.subText}>
                #{tokenId}
              </Text>
            )}
          </Flex>
        </Flex>
      </InboxItemRow>

      {[Status.NEW, Status.ADD, Status.PARTIAL_REMOVE, Status.FULL_REMOVE].includes(status) && (
        <InboxItemRow>
          <Flex alignItems={'center'} style={{ gap: '4px' }}>
            <PrimaryText color={theme.subText}>Balance:</PrimaryText>
            <PrimaryText>
              {formatCurrency(oldValueUsd as number)} ➞ {formatCurrency(newValueUsd as number)}
            </PrimaryText>
          </Flex>
        </InboxItemRow>
      )}

      {[Status.IN_RANGE, Status.OUT_RANGE].includes(status) && (
        <InboxItemRow>
          <PrimaryText>
            {currentPrice} {token0Symbol}/{token1Symbol}
          </PrimaryText>
          <PrimaryText color={theme.subText}>
            {minPrice} - {maxPrice}
          </PrimaryText>
        </InboxItemRow>
      )}
    </InboxItemWrapper>
  )
}

export default InboxItemEarnPosition

const normalizePosition = (position?: PoolPositionAnnouncement | PoolPositionLiquidityAnnouncement) => {
  if (position && 'notificationType' in position) {
    return {
      ...position,
      currentPrice: Number(position.currentPrice),
      minPrice: Number(position.minPrice),
      maxPrice: Number(position.maxPrice),
      exchange: position.kyberswapUrl.match(/[^/]+$/)?.[0] || '',
      oldLiquidity: Number(position.oldLiquidity),
      newLiquidity: Number(position.newLiquidity),
      oldValueUsd: Number(position.oldValueUsd),
      newValueUsd: Number(position.newValueUsd),
    }
  }
  return position as PoolPositionAnnouncement & PoolPositionLiquidityAnnouncement
}
