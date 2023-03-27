import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'
import { CSSProperties } from 'styled-components'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { AnnouncementTemplateBridge, PrivateAnnouncement } from 'components/Announcement/type'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { formatTime } from 'utils/time'

import { Desc, RowItem, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  style,
}: {
  announcement: PrivateAnnouncement<AnnouncementTemplateBridge>
  style?: CSSProperties
}) {
  const { sentAt, templateType, templateBody } = announcement
  const { status, srcTokenSymbol, srcAmount, dstChainId, srcChainId } = templateBody.transaction
  const isSuccess = Number(status) === MultichainTransferStatus.Success
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId
  const navigate = useNavigate()
  return (
    <Wrapper onClick={() => navigate(APP_PATHS.BRIDGE)} style={style}>
      <RowItem>
        <Flex justifyContent="space-between" width="100%">
          <Title>
            <InboxIcon type={templateType} />
            <Trans>Bridge Token</Trans>
          </Title>
          <Flex alignItems={'center'}>
            <Time>{formatTime(sentAt)} </Time>
          </Flex>
        </Flex>
        <Desc>
          {formatAmountBridge(srcAmount)} {srcTokenSymbol}{' '}
          {isSuccess ? t`has been successfully transferred from` : t`has been failed to transferred from`}{' '}
          <NetworkLogo chainId={chainIdIn} style={{ width: 16, height: 16 }} /> {NETWORKS_INFO[chainIdIn].name} to{' '}
          <NetworkLogo chainId={chainIdOut} style={{ width: 16, height: 16 }} /> {NETWORKS_INFO[chainIdOut].name}
        </Desc>
      </RowItem>
    </Wrapper>
  )
}
