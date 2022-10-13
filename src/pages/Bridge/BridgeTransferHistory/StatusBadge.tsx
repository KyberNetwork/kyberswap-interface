import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { CheckCircle, TransferIcon, XCircle } from 'components/Icons'
import { BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

type GeneralStatus = 'success' | 'failed' | 'processing'

const getGeneralStatus = (status: BridgeTransferStatus): GeneralStatus => {
  const mapping: Record<BridgeTransferStatus, GeneralStatus> = {
    [BridgeTransferStatus.Success]: 'success',
    [BridgeTransferStatus.Failure]: 'failed',
    [BridgeTransferStatus.TxNotStable]: 'failed',
    [BridgeTransferStatus.TxNotSwapped]: 'failed',
    [BridgeTransferStatus.ExceedLimit]: 'failed',
    [BridgeTransferStatus.Confirming]: 'processing',
    [BridgeTransferStatus.Swapping]: 'processing',
    [BridgeTransferStatus.BigAmount]: 'processing',
  }

  return mapping[status]
}

const labelByGeneralStatus: Record<GeneralStatus, string> = {
  success: t`Success`,
  failed: t`Failed`,
  processing: t`Processing`,
}

const cssByGeneralStatus: Record<GeneralStatus, any> = {
  success: css`
    background: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.primary};
  `,
  failed: css`
    background: ${({ theme }) => rgba(theme.red, 0.2)};
    color: ${({ theme }) => theme.red};
  `,
  processing: css`
    background: ${({ theme }) => rgba(theme.warning, 0.2)};
    color: ${({ theme }) => theme.warning};
  `,
}

const Wrapper = styled.div<{ status: GeneralStatus; iconOnly: boolean }>`
  width: 100%;
  padding: 4px 8px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border-radius: 24px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  overflow: hidden;

  ${({ status }) => cssByGeneralStatus[status]}
  ${({ iconOnly }) =>
    iconOnly &&
    css`
      padding: 0;
      width: 20px;
      height: 20px;
    `}
`

type Props = {
  status: BridgeTransferStatus
  iconOnly?: boolean
}
const StatusBadge: React.FC<Props> = ({ status, iconOnly }) => {
  const generalStatus = getGeneralStatus(status)
  const label = labelByGeneralStatus[generalStatus]

  const renderIcon = () => {
    if (generalStatus === 'success') {
      return <CheckCircle width="12px" height="12px" />
    }

    if (generalStatus === 'failed') {
      return <XCircle width="12px" height="12px" />
    }

    if (generalStatus === 'processing') {
      return <TransferIcon width="12px" height="12px" />
    }

    return null
  }

  return (
    <Wrapper iconOnly={!!iconOnly} status={generalStatus}>
      {renderIcon()}
      {!iconOnly && (
        <Text
          as="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Text>
      )}
    </Wrapper>
  )
}

export default StatusBadge
