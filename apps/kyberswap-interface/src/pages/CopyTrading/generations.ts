import type { AgentCard, Chain } from 'services/copyTrading/types/agents'

import { canAttemptPreparation } from 'pages/CopyTrading/helpers'

export const resolveStartCopyEligibility = (
  chain: Chain | undefined,
  agent: Pick<AgentCard, 'startCopyAvailabilities'>,
) => {
  const choices = (chain?.isEnabled ? chain.accountGenerations || [] : [])
    .filter(
      generation =>
        generation.lifecycle === 'ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED' &&
        generation.capabilities.includes('ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY'),
    )
    .map(generation => ({
      ...generation,
      availability: agent.startCopyAvailabilities?.find(entry => entry.generationId === generation.generationId)
        ?.availability,
    }))
  const eligible = choices.filter(choice => canAttemptPreparation(choice.availability))
  const canStart = eligible.length === 1
  return {
    canStart,
    generationId: canStart ? eligible[0].generationId : undefined,
    reason: !canStart && choices.length === 1 ? choices[0].availability?.reason : undefined,
  }
}
