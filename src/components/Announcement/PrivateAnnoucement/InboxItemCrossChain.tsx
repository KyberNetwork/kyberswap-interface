import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

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
import { AnnouncementTemplateCrossChain } from 'components/Announcement/type'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { CrossChainTab } from 'pages/CrossChain/TransfersHistory/TabSelector'
import { isCrossChainTxsSuccess } from 'pages/CrossChain/helpers'
import { CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'

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
}: PrivateAnnouncementProp<AnnouncementTemplateCrossChain>) {
  const { templateBody, isRead, templateType } = announcement
  const {
    status,
    srcAmount,
    dstChainId,
    srcChainId,
    dstAmount,
    dstTokenLogoUrl,
    srcTokenLogoUrl,
    srcTokenSymbol,
    dstTokenSymbol,
    dstTxHash,
    srcTxHash,
  } = templateBody.transaction
  const isSuccess = isCrossChainTxsSuccess(status)
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId

  const rate = formatAmountBridge(String(+dstAmount / +srcAmount))

  const theme = useTheme()

  const navigate = useNavigate()

  const statusMessage = isSuccess ? t`Success` : t`Failed`
  const onClick = () => {
    navigate(`${APP_PATHS.CROSS_CHAIN}?tab=${CrossChainTab.HISTORY}`)
    onRead(announcement, statusMessage)
  }

  const etherscanChainSrcChain = [
    CrossChainTransferStatus.SRC_GATEWAY_CALLED,
    CrossChainTransferStatus.SRC_GATEWAY_CALLED_FAILED,
  ].includes(status)

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {title}{' '}
            <ExternalLinkIcon
              href={getEtherscanLink(
                etherscanChainSrcChain ? chainIdIn : chainIdOut,
                etherscanChainSrcChain ? srcTxHash : dstTxHash,
                'transaction',
              )}
              color={theme.text}
            />
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{statusMessage}</PrimaryText>
          {isSuccess ? <CheckCircle color={theme.primary} /> : <IconFailure color={theme.red} size={12} />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Row gap="6px" width={'fit-content'}>
          <DeltaTokenAmount
            amount={formatAmountBridge(srcAmount)}
            symbol={srcTokenSymbol}
            logoURL={srcTokenLogoUrl}
            style={{ whiteSpace: 'nowrap' }}
          />
          to
          <DeltaTokenAmount
            amount={formatAmountBridge(dstAmount)}
            symbol={dstTokenSymbol}
            logoURL={dstTokenLogoUrl}
            style={{ whiteSpace: 'nowrap' }}
          />
        </Row>
        {rate && (
          <PrimaryText style={{ textAlign: 'right' }}>
            {rate} {srcTokenSymbol}/{dstTokenSymbol}
          </PrimaryText>
        )}
      </InboxItemRow>

      <InboxItemRow>
        <Row gap="6px" width={'fit-content'}>
          <NetworkRow>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdIn].name}</PrimaryText>
          </NetworkRow>
          to
          <NetworkRow>
            <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
            <PrimaryText color={theme.subText}>{NETWORKS_INFO[chainIdOut].name}</PrimaryText>
          </NetworkRow>
        </Row>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
