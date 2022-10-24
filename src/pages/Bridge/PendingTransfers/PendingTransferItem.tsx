import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import QuestionHelper from 'components/QuestionHelper'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'

import DecorationLine from './DecorationLine'
import ExternalLinkButton from './ExternalLinkButton'

const ChainLogoWrapper = styled.div`
  width: 64px;
  height: 64px;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
`

const TxDetail = styled.div`
  flex: 1;
  position: relative;
  align-self: stretch;
  padding: 4px 0;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const TxDetailRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const TxDetailCell = styled.div<{ justifyContent: 'flex-start' | 'center' | 'flex-end' }>`
  display: flex;
  align-items: center;
  justify-content: ${({ justifyContent }) => justifyContent || 'flex-start'};

  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
`

const TxHashInfo: React.FC<{
  hash: string
  url: string
  justifyContent: 'flex-start' | 'center' | 'flex-end'
}> = ({ hash, url, justifyContent }) => {
  const theme = useTheme()
  return (
    <TxDetailCell justifyContent={justifyContent}>
      <Text
        as="span"
        color={theme.subText}
        sx={{
          marginLeft: '4px',
        }}
      >
        Txn Hash
      </Text>

      <CopyHelper
        toCopy={hash}
        style={{
          margin: '0 4px',
          color: theme.subText,
        }}
      />

      <ExternalLinkButton url={url} disabled={!url} />
    </TxDetailCell>
  )
}

type Props = {
  className?: string
  transfer: MultichainTransfer
}

const PendingTransferItem: React.FC<Props> = ({ className, transfer }) => {
  const isDark = useIsDarkMode()
  const theme = useTheme()

  const renderChainIcon = (chainId: ChainId) => {
    const chainInfo = NETWORKS_INFO_CONFIG[chainId]
    if (chainInfo) {
      const src = isDark && chainInfo.iconDark ? chainInfo.iconDark : chainInfo.icon
      return <img src={src} alt={chainInfo.name} style={{ width: '28px' }} />
    }

    return (
      <Box
        sx={{
          // QuestionHelper has an intrinsic marginLeft of 0.25rem
          marginLeft: '-0.25rem',
        }}
      >
        <QuestionHelper placement="top" size={28} text={t`ChainId: ${chainId} not supported`} />
      </Box>
    )
  }

  const renderSendTxInfo = () => {
    const explorerUrl = NETWORKS_INFO_CONFIG[transfer.srcChainID as ChainId]?.etherscanUrl

    return (
      <TxHashInfo
        justifyContent="flex-start"
        hash={transfer.srcTxHash}
        url={explorerUrl ? `${explorerUrl}/tx/${transfer.srcTxHash}` : ''}
      />
    )
  }

  const renderReceiveTxInfo = () => {
    const explorerUrl = NETWORKS_INFO_CONFIG[transfer.dstChainID as ChainId]?.etherscanUrl

    return (
      <TxHashInfo
        justifyContent="flex-end"
        hash={transfer.dstTxHash}
        url={explorerUrl ? `${explorerUrl}/tx/${transfer.dstTxHash}` : ''}
      />
    )
  }

  return (
    <div className={className}>
      <ChainLogoWrapper>{renderChainIcon(transfer.srcChainID as ChainId)}</ChainLogoWrapper>

      <TxDetail>
        <TxDetailRow>
          <TxDetailCell justifyContent="flex-start">
            <Text as="span" color={theme.border}>
              - {transfer.srcAmount} {transfer.srcTokenSymbol}
            </Text>
          </TxDetailCell>

          <TxDetailCell justifyContent="flex-end">
            <Text as="span" color={theme.primary}>
              + {transfer.dstAmount} {transfer.dstTokenSymbol}
            </Text>
          </TxDetailCell>
        </TxDetailRow>

        <TxDetailRow>
          {renderSendTxInfo()}
          {renderReceiveTxInfo()}
        </TxDetailRow>

        <DecorationLine />
      </TxDetail>

      <ChainLogoWrapper>{renderChainIcon(transfer.dstChainID as ChainId)}</ChainLogoWrapper>
    </div>
  )
}

export default styled(PendingTransferItem)`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
`
