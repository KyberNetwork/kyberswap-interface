import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'

import ProcessingStepsModal from 'components/ProcessingSteps/ProcessingStepsModal'
import type { ProcessingController } from 'components/ProcessingSteps/useProcessingSteps'
import { APP_PATHS } from 'constants/index'
import {
  VaultActionKind,
  VaultStep,
  getVaultProcessingTitle,
  getVaultStepLabel,
} from 'pages/Earns/components/vaultSteps'

/** The vault wording and the destination offered on success, around the shared step modal. */
const VaultProcessingModal = ({
  processing,
  chainId,
  tokenSymbol,
  approveSymbols,
  kind,
  errorMessage,
  onClose,
}: {
  processing: ProcessingController<VaultStep>
  chainId?: ChainId
  tokenSymbol?: string
  /** Symbol per approval step, for a run that spends several tokens. */
  approveSymbols?: Record<string, string>
  kind: VaultActionKind
  errorMessage?: string | null
  onClose?: () => void
}) => {
  const navigate = useNavigate()

  return (
    <ProcessingStepsModal
      chainId={chainId}
      processing={processing}
      title={getVaultProcessingTitle(kind)}
      getStepLabel={getVaultStepLabel({ tokenSymbol, approveSymbols, kind })}
      errorMessage={errorMessage}
      successAction={{ label: t`View positions`, onClick: () => navigate(APP_PATHS.EARN_MY_VAULTS) }}
      onClose={onClose}
    />
  )
}

export default VaultProcessingModal
