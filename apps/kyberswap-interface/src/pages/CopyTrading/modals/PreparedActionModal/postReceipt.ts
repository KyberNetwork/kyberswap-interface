import type {
  ActionReceiptReference,
  SubmittedActionStatusRequest,
  SubmittedActionStatusResponse,
} from 'services/copyTrading/types/actionStatus'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { wait } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import type { Hash } from 'utils/viem'

export class SubmittedActionFailedError extends Error {}

type GetSubmittedActionStatus = (request: SubmittedActionStatusRequest) => {
  unwrap: () => Promise<SubmittedActionStatusResponse>
}

export const pollSubmittedActionStatus = async ({
  action,
  hash,
  getStatus,
  waitForCallbackData = false,
  maxAttempts = 11,
  waitForNextAttempt = wait,
}: {
  action: PreparedAction
  hash: Hash
  getStatus: GetSubmittedActionStatus
  waitForCallbackData?: boolean
  maxAttempts?: number
  waitForNextAttempt?: (milliseconds: number) => Promise<void>
}) => {
  const statusContext = action.statusContext
  const ownerAddress = action.expectedAccount
  const hasMatchingOwner = statusContext?.expectedOwner?.toLowerCase() === ownerAddress?.toLowerCase()
  if (!statusContext || !ownerAddress || !hasMatchingOwner) {
    throw new Error('The submitted action is missing its original status context or has a mismatched owner.')
  }

  let previousReceipt: ActionReceiptReference | undefined
  let message = 'The submitted result is still updating. Check transaction status again shortly.'
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Request errors return to the existing sync retry UI, retaining this action and hash.
    const { data } = await getStatus({
      ownerAddress,
      statusContext,
      transactionHash: hash,
      previousReceipt,
      resultMode: 'SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST',
    }).unwrap()
    if (data.transaction?.receipt) previousReceipt = data.transaction.receipt
    message = data.guidance?.message || message

    if (data.status === 'SUBMITTED_ACTION_STATUS_FAILED') {
      throw new SubmittedActionFailedError(
        data.guidance?.message || 'The transaction reverted. Prepare a new call before trying again.',
      )
    }

    // Complete as soon as the verified effect or ready display is available.
    const hasVerifiedEffects = !!data.receiptResult
    const isDisplayReady = data.display?.status === 'SUBMITTED_ACTION_DISPLAY_STATUS_READY'
    const hasSucceeded = data.status === 'SUBMITTED_ACTION_STATUS_SUCCEEDED'
    const hasReadyCopyRun = isDisplayReady && !!data.display?.copyRunId
    const hasSucceededCopyRun = hasSucceeded && !!data.result?.copyRunId
    const hasCallbackData = hasReadyCopyRun || hasSucceededCopyRun
    const canComplete = !waitForCallbackData || hasCallbackData
    if (canComplete && (hasVerifiedEffects || isDisplayReady || hasSucceeded)) {
      return data
    }

    const delay = data.guidance?.retryAfterMs
    const hasValidRetryDelay = delay !== undefined && Number.isFinite(delay) && delay >= 0
    if (!hasValidRetryDelay) {
      throw new Error(data.guidance?.message || 'The transaction result could not be verified. Check its status again.')
    }
    if (attempt < maxAttempts - 1) await waitForNextAttempt(delay)
  }
  throw new Error(message)
}
