import { t } from '@lingui/macro'

import type { ProcessingStepStatus } from 'components/ProcessingSteps/useProcessingSteps'

/**
 * Wording for an allowance step. Shared so every flow contributes one set of strings to the
 * translation catalogs rather than one per flow.
 */
export const getApproveStepLabel = (symbol: string | undefined, status: ProcessingStepStatus) => {
  if (status === 'active') return symbol ? t`Approving ${symbol}` : t`Approving token`
  if (status === 'success') return symbol ? t`Approved ${symbol}` : t`Approved token`
  return symbol ? t`Approve ${symbol}` : t`Approve token`
}
