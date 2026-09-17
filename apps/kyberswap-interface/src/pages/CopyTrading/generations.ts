import type { AgentCard, Chain } from 'services/copyTrading/types/agents'

import { canAttemptPreparation } from 'pages/CopyTrading/helpers'

export const getStartGenerationChoices = (
  chain: Chain | undefined,
  agent: Pick<AgentCard, 'startCopyAvailabilities' | 'feePolicies'>,
) =>
  (chain?.isEnabled ? chain.accountGenerations || [] : [])
    .filter(
      generation =>
        generation.lifecycle === 'ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED' &&
        generation.capabilities.includes('ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY'),
    )
    .map(generation => ({
      ...generation,
      availability: agent.startCopyAvailabilities?.find(entry => entry.generationId === generation.generationId)
        ?.availability,
      feePolicy: agent.feePolicies?.find(entry => entry.generationId === generation.generationId),
    }))

export const getSelectedStartGenerationId = (
  choices: ReturnType<typeof getStartGenerationChoices>,
  selectedId?: string,
) => {
  // Never replace a pinned attempt after catalog retirement or disappearance.
  if (selectedId) return selectedId
  const eligible = choices.filter(choice => canAttemptPreparation(choice.availability))
  return eligible.length === 1 ? eligible[0].generationId : undefined
}
