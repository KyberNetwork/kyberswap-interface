import { useCallback } from 'react'
import { BuildDustSwapData, prepareBuildDustSwapRequest, useBuildDustSwapRouteMutation } from 'services/dustSwap'

import { useActiveWeb3React } from 'hooks'

export type BuildArgs = {
  route: string
  recipient?: string
  deadlineSecondsFromNow?: number
  permits?: Record<string, string>
}

type Result = {
  build: (args: BuildArgs) => Promise<BuildDustSwapData>
  isBuilding: boolean
}

const DEFAULT_DEADLINE_FROM_NOW_S = 60 * 20 // 20 minutes

const useBuildDustRoute = (): Result => {
  const { account, chainId } = useActiveWeb3React()
  const [buildMutation, { isLoading }] = useBuildDustSwapRouteMutation()

  const build = useCallback<Result['build']>(
    async ({ route, recipient, deadlineSecondsFromNow, permits }) => {
      if (!account) throw new Error('Wallet not connected')
      const deadline = Math.floor(Date.now() / 1000) + (deadlineSecondsFromNow ?? DEFAULT_DEADLINE_FROM_NOW_S)
      const { data, error } = prepareBuildDustSwapRequest({
        chainId,
        sender: account,
        recipient: recipient || account,
        route,
        deadline,
        permits,
        source: 'kyberswap',
      })
      if (error || !data) throw new Error(error || 'Failed to prepare build request')
      const resp = await buildMutation(data).unwrap()
      if (!resp.data) throw new Error(resp.message || 'Failed to build dust swap')
      return resp.data
    },
    [account, chainId, buildMutation],
  )

  return { build, isBuilding: isLoading }
}

export default useBuildDustRoute
