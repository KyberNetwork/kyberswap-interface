import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { AlertCircle } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { CheckCircle, XCircle } from 'components/Icons'
import { BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

type GeneralStatus = 'success' | 'failure' | 'info'

const getGeneralStatus = (status: BridgeTransferStatus): GeneralStatus => {
  const mapping: Record<BridgeTransferStatus, GeneralStatus> = {
    [BridgeTransferStatus.Success]: 'success',
    [BridgeTransferStatus.Failure]: 'failure',
    [BridgeTransferStatus.TxNotStable]: 'failure',
    [BridgeTransferStatus.TxNotSwapped]: 'failure',
    [BridgeTransferStatus.ExceedLimit]: 'failure',
    [BridgeTransferStatus.Confirming]: 'info',
    [BridgeTransferStatus.Swapping]: 'info',
    [BridgeTransferStatus.BigAmount]: 'info',
  }

  return mapping[status]
}

const labelByStatus: Record<BridgeTransferStatus, string> = {
  [BridgeTransferStatus.TxNotStable]: t`Tx Not Stable`,
  [BridgeTransferStatus.TxNotSwapped]: t`Tx Not Swapped`,
  [BridgeTransferStatus.ExceedLimit]: t`Exceed Limit`,
  [BridgeTransferStatus.Confirming]: t`Confirming`,
  [BridgeTransferStatus.Swapping]: t`Swapping`,
  [BridgeTransferStatus.Success]: t`Success`,
  [BridgeTransferStatus.BigAmount]: t`Big Amount`,
  [BridgeTransferStatus.Failure]: t`Failure`,
}

const cssByGeneralStatus: Record<GeneralStatus, any> = {
  success: css`
    background: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.primary};
  `,
  failure: css`
    background: ${({ theme }) => rgba(theme.red, 0.2)};
    color: ${({ theme }) => theme.red};
  `,
  info: css`
    background: ${({ theme }) => rgba(theme.subText, 0.2)};
    color: ${({ theme }) => theme.subText};
  `,
}

const Wrapper = styled.div<{ status: GeneralStatus; iconOnly: boolean }>`
  width: fit-content;
  padding: 4px 8px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border-radius: 24px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  ${({ status }) => cssByGeneralStatus[status]}
  ${({ iconOnly }) =>
    iconOnly &&
    css`
      padding: 4px;
    `}
`

type Props = {
  status: BridgeTransferStatus
  iconOnly?: boolean
}
const StatusBadge: React.FC<Props> = ({ status, iconOnly }) => {
  const label = labelByStatus[status]
  const generalStatus = getGeneralStatus(status)

  const renderIcon = () => {
    if (generalStatus === 'success') {
      return <CheckCircle width="12px" height="12px" />
    }

    if (generalStatus === 'failure') {
      return <XCircle width="12px" height="12px" />
    }

    if (generalStatus === 'info') {
      return <AlertCircle size={12} />
    }

    return null
  }

  return (
    <Wrapper iconOnly={!!iconOnly} status={generalStatus}>
      {renderIcon()}
      {!iconOnly && <Text>{label}</Text>}
    </Wrapper>
  )
}

export default StatusBadge
