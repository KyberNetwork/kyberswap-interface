import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as ArrowDown } from 'assets/svg/arrow_down.svg'
import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateBridge } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'

const NetworkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateBridge>) {
  const { templateBody, isRead, templateType } = announcement
  const { status, srcTokenSymbol, srcAmount, dstChainId, srcChainId } = templateBody?.transaction || {}
  const isSuccess = Number(status) === MultichainTransferStatus.Success
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId

  const theme = useTheme()

  const navigate = useNavigate()

  const statusMessage = isSuccess ? t`Success` : t`Failed`
  const onClick = () => {
    navigate(APP_PATHS.BRIDGE)
    onRead(announcement, statusMessage)
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{statusMessage}</PrimaryText>
          {isSuccess ? <CheckCircle color={theme.primary} /> : <IconFailure color={theme.red} size={12} />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <div style={{ position: 'relative' }}>
          <NetworkRow>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdIn].name}</PrimaryText>
          </NetworkRow>
          <ArrowDown style={{ position: 'absolute', left: 4, height: 10 }} />
        </div>

        <PrimaryText>
          {formatAmountBridge(srcAmount)} {srcTokenSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <NetworkRow>
          <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
          <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdOut].name}</PrimaryText>
        </NetworkRow>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
