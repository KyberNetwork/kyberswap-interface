import type { AccountGenerationProductCapability, Chain } from 'services/copyTrading/types/agents'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import type { PreparedActionExpectation } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

const capabilities: Record<PreparedActionExpectation['preview'], AccountGenerationProductCapability> = {
  startCopy: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY',
  addCapital: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_ADD_CAPITAL',
  stopCopy: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_STOP_COPY',
  withdrawQuote: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_QUOTE',
  withdrawTokens: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_TOKENS',
  manualSell: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_MANUAL_SELL',
  closePosition: 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_CLOSE_POSITION',
}

export const getGenerationExecutionError = (
  chains: Chain[],
  action: PreparedAction,
  preview: PreparedActionExpectation['preview'],
) => {
  const chain = chains.find(chain => chain.chainId === Number(action.chainId))
  const generation = chain?.accountGenerations?.find(generation => generation.generationId === action.generationId)
  if (!chain?.isEnabled || !generation) return 'This contract generation is unavailable. Refresh and prepare again.'
  if (generation.lifecycle === 'ACCOUNT_GENERATION_LIFECYCLE_READ_ONLY') {
    return 'This contract generation is read-only.'
  }
  if (
    generation.lifecycle !== 'ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED' &&
    generation.lifecycle !== 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY'
  )
    return 'This contract generation does not support execution.'

  // An existing Start attempt may still fund its original account during retirement.
  if (
    preview === 'startCopy' &&
    generation.lifecycle === 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY' &&
    action.startCopy?.stage !== 'START_COPY_STAGE_FUNDING_REQUIRED'
  )
    return 'This contract generation no longer supports new copies.'

  const fundingRetiredStart =
    preview === 'startCopy' &&
    generation.lifecycle === 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY' &&
    action.startCopy?.stage === 'START_COPY_STAGE_FUNDING_REQUIRED'
  if (!fundingRetiredStart && !generation.capabilities.includes(capabilities[preview])) {
    return 'This contract generation does not support this action.'
  }
  return undefined
}
