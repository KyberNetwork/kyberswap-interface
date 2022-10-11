import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Box } from 'rebass'
import styled, { css } from 'styled-components'

import { BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

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

const Wrapper = styled.div<{ isSuccess: boolean }>`
  grid-area: 'status';

  width: fit-content;
  height: 20px;
  padding: 0 12px;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 24px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  ${({ isSuccess, theme }) =>
    isSuccess
      ? css`
          background: ${rgba(theme.primary, 0.2)};
          color: ${theme.primary};
        `
      : css`
          background: ${rgba(theme.red, 0.2)};
          color: ${theme.red};
        `}
`

type Props = {
  status: BridgeTransferStatus
}
const StatusBadge: React.FC<Props> = ({ status }) => {
  const label = labelByStatus[status]
  return (
    <Box>
      <Wrapper isSuccess={status === BridgeTransferStatus.Success}>{label}</Wrapper>
    </Box>
  )
}

export default StatusBadge
