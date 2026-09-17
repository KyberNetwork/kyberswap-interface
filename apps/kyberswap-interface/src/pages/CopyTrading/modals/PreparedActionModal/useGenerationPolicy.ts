import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { getGenerationExecutionError } from 'pages/CopyTrading/modals/PreparedActionModal/generationPolicy'
import type { PreparedActionExpectation } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export const useGenerationPolicy = (preview: PreparedActionExpectation['preview']) => {
  const { refetch } = discoveryApi.useGetChainsQuery(undefined, { refetchOnMountOrArgChange: true })

  return async (action: PreparedAction) => {
    const catalog = await refetch().unwrap()
    const error = getGenerationExecutionError(catalog.data, action, preview)
    if (error) throw new Error(error)
  }
}
