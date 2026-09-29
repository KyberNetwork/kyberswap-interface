import { MAX_TOKENS } from '@kyber/token-selector'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import type { ProcessingApproval } from 'components/ProcessingSteps/useProcessingSteps'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { useCheckAllowance } from 'hooks/useCheckAllowance'
import type { VaultDepositInput } from 'pages/Earns/VaultDetail/hooks/useVaultDeposit'
import { VaultStep, vaultApproveStep } from 'pages/Earns/components/vaultSteps'

type ApprovalSlotArgs = {
  input?: VaultDepositInput
  spender?: string
  chainId: ChainId
  account?: string
}

/** The allowance for one token, or an idle pair of callbacks when the slot holds no token. */
const useApprovalSlot = ({ input, spender, chainId, account }: ApprovalSlotArgs) => {
  const [approval, approveCallback] = useApproveCallback({
    amount: input?.parsedAmount,
    spender,
    forceApprove: true,
  })
  const checkApprovalManually = useCheckAllowance({
    account,
    amount: input?.parsedAmount,
    chainId,
    currency: input?.currency,
    spender,
  })

  // Memoised: the slots are the deps of the list below, and a fresh literal each render would
  // rebuild that list, the step sequence built from it, and every object handed to the forms.
  return useMemo(
    () => ({ approval, approveCallback, checkApprovalManually }),
    [approval, approveCallback, checkApprovalManually],
  )
}

/**
 * One allowance per token a deposit spends, in the form's order, ready for the step sequence.
 *
 * A component must call the same hooks in the same order on every render, so the allowances are read
 * from a fixed set of slots rather than from a loop over the tokens. An empty slot costs nothing:
 * without an amount and a spender neither hook reads anything on chain.
 *
 * Native currency is left out — it is passed by value, so there is no spender to allow.
 */
export const useDepositApprovals = ({
  inputs,
  spender,
  chainId,
  account,
}: {
  inputs: VaultDepositInput[]
  /** The router the route wants to pull the tokens through. */
  spender?: string
  chainId: ChainId
  account?: string
}): ProcessingApproval<VaultStep>[] => {
  // One slot per token the selector will hand over; keep these in step with MAX_TOKENS.
  const slot0 = useApprovalSlot({ input: inputs[0], spender, chainId, account })
  const slot1 = useApprovalSlot({ input: inputs[1], spender, chainId, account })
  const slot2 = useApprovalSlot({ input: inputs[2], spender, chainId, account })
  const slot3 = useApprovalSlot({ input: inputs[3], spender, chainId, account })
  const slot4 = useApprovalSlot({ input: inputs[4], spender, chainId, account })

  return useMemo(() => {
    const slots = [slot0, slot1, slot2, slot3, slot4].slice(0, MAX_TOKENS)

    return inputs
      .slice(0, slots.length)
      .map((input, index) =>
        input.currency.isNative
          ? undefined
          : { step: vaultApproveStep(input.currency.wrapped.address), ...slots[index] },
      )
      .filter((entry): entry is ProcessingApproval<VaultStep> => Boolean(entry))
  }, [inputs, slot0, slot1, slot2, slot3, slot4])
}
