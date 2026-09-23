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
  maxAttempts = 11,
  waitForNextAttempt = wait,
}: {
  action: PreparedAction
  hash: Hash
  getStatus: GetSubmittedActionStatus
  maxAttempts?: number
  waitForNextAttempt?: (milliseconds: number) => Promise<void>
}) => {
  const statusContext = action.statusContext
  const ownerAddress = action.expectedAccount
  if (!statusContext || !ownerAddress || statusContext.expectedOwner?.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error('The submitted action is missing its original status context or has a mismatched owner.')
  }

  let previousReceipt: ActionReceiptReference | undefined
  let message = 'The submitted result is still updating. Check transaction status again shortly.'
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Request errors return to the existing sync retry UI, retaining this action and hash.
    const { data } = await getStatus({ ownerAddress, statusContext, transactionHash: hash, previousReceipt }).unwrap()
    if (data.transaction?.receipt) previousReceipt = data.transaction.receipt
    message = data.guidance?.message || message

    if (data.transaction?.outcome === 'ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED') {
      throw new SubmittedActionFailedError(
        data.guidance?.message || 'The transaction reverted. Prepare a new call before trying again.',
      )
    }

    // READY confirms the action's public data is readable, even while strict status is SYNCING.
    if (data.display?.status === 'SUBMITTED_ACTION_DISPLAY_STATUS_READY') return data

    const delay = data.guidance?.retryAfterMs
    if (delay === undefined || !Number.isFinite(delay) || delay < 0) {
      throw new Error(data.guidance?.message || 'The transaction result could not be verified. Check its status again.')
    }
    if (attempt < maxAttempts - 1) await waitForNextAttempt(delay)
  }
  throw new Error(message)
}
