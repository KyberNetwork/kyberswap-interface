import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { getApproveStepLabel } from 'components/ProcessingSteps/stepLabels'
import type { ProcessingStepStatus } from 'components/ProcessingSteps/useProcessingSteps'
import { NativeCurrencies } from 'constants/tokens'

export type ProcessingOrderStep = 'wrap' | 'approve' | 'create' | 'fill'

/** Wording for the limit-order steps, handed to the shared modal. */
export const getLimitOrderStepLabel =
  ({ chainId, currencyIn }: { chainId: ChainId | undefined; currencyIn: Currency | undefined }) =>
  (step: ProcessingOrderStep, status: ProcessingStepStatus) => {
    if (step === 'wrap') {
      const nativeSymbol = chainId ? NativeCurrencies[chainId].symbol : t`token`
      if (status === 'active') return t`Wrapping ${nativeSymbol}`
      if (status === 'success') return t`Wrapped ${nativeSymbol}`
      return t`Wrap ${nativeSymbol}`
    }

    if (step === 'approve') return getApproveStepLabel(currencyIn?.wrapped.symbol, status)

    if (step === 'create') {
      if (status === 'active') return t`Signing order`
      if (status === 'success') return t`Order successfully listed`
      return t`Sign order`
    }

    if (status === 'active') return t`Filling order`
    if (status === 'success') return t`Order filled`
    return t`Fill order`
  }
