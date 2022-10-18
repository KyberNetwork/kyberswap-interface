import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { Box, Text } from 'rebass'
import styled, { css } from 'styled-components'

import CopyHelper from 'components/Copy'
import QuestionHelper from 'components/QuestionHelper'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { BridgeTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'

import { getAmountReceive, getLabelByStatus, getTokenSymbol } from '../utils'
import DecorationLine from './DecorationLine'
import ExternalLinkButton from './ExternalLinkButton'

const ChainLogoWrapper = styled.div<{ isActive?: boolean }>`
  width: 64px;
  height: 64px;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 16px;
  border: 2px solid ${({ theme }) => theme.border};

  ${({ theme, isActive }) =>
    isActive &&
    css`
      border: 2px solid ${theme.primary};
    `}
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
  padding: 0 8px;

  display: flex;
  align-items: center;
`

const TxDetailCell = styled.div<{ justifyContent: 'flex-start' | 'center' | 'flex-end' }>`
  flex: 1 1 100%;
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
  transfer: BridgeTransfer
}

const PendingTransferItem: React.FC<Props> = ({ className, transfer }) => {
  const isDark = useIsDarkMode()
  const theme = useTheme()

  const amountSend = Number(transfer.formatvalue).toFixed(2)
  const amountReceive = getAmountReceive(transfer.formatvalue, transfer.formatswapvalue, transfer.swapvalue)
  const fromChainID = Number(transfer.fromChainID)
  const toChainID = Number(transfer.toChainID)
  const tokenSymbol = getTokenSymbol(transfer)

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
    const explorerUrl = NETWORKS_INFO_CONFIG[fromChainID as ChainId]?.etherscanUrl

    return (
      <TxHashInfo
        justifyContent="flex-start"
        hash={transfer.txid}
        url={explorerUrl ? `${explorerUrl}/tx/${transfer.txid}` : ''}
      />
    )
  }

  const renderReceiveTxInfo = () => {
    const explorerUrl = NETWORKS_INFO_CONFIG[toChainID as ChainId]?.etherscanUrl

    return (
      <TxHashInfo
        justifyContent="flex-end"
        hash={transfer.swaptx}
        url={explorerUrl ? `${explorerUrl}/tx/${transfer.swaptx}` : ''}
      />
    )
  }

  return (
    <div className={className}>
      <ChainLogoWrapper>{renderChainIcon(fromChainID as ChainId)}</ChainLogoWrapper>

      <TxDetail>
        <TxDetailRow>
          <TxDetailCell justifyContent="flex-start">
            <Text
              as="span"
              color={theme.border}
              sx={{
                marginLeft: '4px',
              }}
            >
              - {amountSend} {tokenSymbol}
            </Text>
          </TxDetailCell>

          <TxDetailCell justifyContent="center">
            <Text as="span" color={theme.subText}>
              {getLabelByStatus(transfer.status)}
            </Text>
          </TxDetailCell>

          <TxDetailCell justifyContent="flex-end">
            <Text
              as="span"
              color={theme.primary}
              sx={{
                marginLeft: '4px',
              }}
            >
              + {amountReceive} {tokenSymbol}
            </Text>
          </TxDetailCell>
        </TxDetailRow>

        <TxDetailRow>
          {renderSendTxInfo()}
          {renderReceiveTxInfo()}
        </TxDetailRow>

        <DecorationLine />
      </TxDetail>

      <ChainLogoWrapper>{renderChainIcon(toChainID as ChainId)}</ChainLogoWrapper>
    </div>
  )
}

export default styled(PendingTransferItem)`
  width: 100%;
  display: flex;
  align-items: center;
`
