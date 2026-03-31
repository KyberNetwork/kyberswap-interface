import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useCreateSmartExitOrderMutation,
  useEstimateSmartExitFeeMutation,
  useGetSmartExitSignMessageMutation,
} from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useSuccessSound } from 'hooks/useSuccessSound'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { SmartExitState } from 'pages/Earns/components/SmartExit/constants'
import { buildConditions } from 'pages/Earns/components/SmartExit/utils'
import { EARN_DEXES } from 'pages/Earns/constants'
import { ConditionType, ParsedPosition, SelectedMetric, SmartExitFee } from 'pages/Earns/types'
import { getPositionLiquidity } from 'pages/Earns/utils/position'
import { useNotify } from 'state/application/hooks'
import { friendlyError } from 'utils/errorMessage'

export interface UseSmartExitParams {
  position: ParsedPosition | null
  selectedMetrics: Array<SelectedMetric | null>
  conditionType: ConditionType
  deadline: number
}

export const useSmartExit = ({ position, selectedMetrics, conditionType, deadline }: UseSmartExitParams) => {
  const notify = useNotify()
  const { trackingHandler } = useTracking()
  const playSuccessSound = useSuccessSound()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [state, setState] = useState<SmartExitState>(SmartExitState.IDLE)
  const [positionLiquidity, setPositionLiquidity] = useState<string | null>(null)
  const [getSignMessage] = useGetSmartExitSignMessageMutation()
  const [estimateFeeMutation] = useEstimateSmartExitFeeMutation()
  const [createOrderMutation] = useCreateSmartExitOrderMutation()

  const dexType = position ? EARN_DEXES[position.dex.id]?.smartExitDexType : undefined

  useEffect(() => {
    if (!position) {
      setPositionLiquidity(null)
      return
    }

    let cancelled = false

    const getLiquidity = async () => {
      const liquidity = await getPositionLiquidity({
        tokenId: position.tokenId,
        dex: position.dex.id,
        poolAddress: position.pool.address,
        chainId: position.chain.id,
      })
      if (!cancelled) {
        setPositionLiquidity(liquidity?.toString() || null)
      }
    }

    getLiquidity()

    return () => {
      cancelled = true
    }
  }, [position])

  const baseParams = useMemo(() => {
    if (!account || !positionLiquidity || !dexType || !position) return null

    return {
      chainId: position.chain.id,
      userWallet: account,
      dexType,
      poolId: position.pool.address,
      positionId: position.positionId,
      removeLiquidity: positionLiquidity,
      unwrap: false,
      condition: buildConditions(selectedMetrics.filter(metric => metric !== null) as SelectedMetric[], conditionType, [
        Math.floor(position.token0.totalProvide * 10 ** position.token0.decimals),
        Math.floor(position.token1.totalProvide * 10 ** position.token1.decimals),
      ]),
      deadline,
    }
  }, [account, conditionType, deadline, dexType, position, positionLiquidity, selectedMetrics])

  const getSmartExitTrackingPayload = useCallback(() => {
    if (!position) return {}

    const conditions = selectedMetrics.filter(m => m !== null) as SelectedMetric[]
    return {
      position_id: position.positionId,
      chain: NETWORKS_INFO[position.chain.id as ChainId]?.name,
      pool: position.pool.address,
      token_pair: `${position.token0.symbol}/${position.token1.symbol}`,
      condition_mode: conditions.length > 1 ? 'multi' : 'single',
      condition_type: conditions.map(c => c.metric).join(','),
      condition_1_value: conditions[0] ? JSON.stringify(conditions[0].condition) : undefined,
      condition_2_value: conditions[1] ? JSON.stringify(conditions[1].condition) : undefined,
    }
  }, [position, selectedMetrics])

  const createSmartExitOrder = useCallback(
    async (opts: { maxGas: number; permitData: string }): Promise<boolean> => {
      if (!library || !baseParams || !account) return false

      setState(SmartExitState.CREATING)
      try {
        // Step 1: Get sign message from API
        const createSmartExitOrderParams = {
          ...baseParams,
          maxGasPercentage: opts.maxGas,
          permitData: opts.permitData,
        }

        const signMessageResult = await getSignMessage(createSmartExitOrderParams).unwrap()
        const typedData = signMessageResult.message

        if (!typedData || !typedData.domain || !typedData.types || !typedData.message) {
          throw new Error('Failed to get valid typed data from API')
        }

        // Step 2: Sign the typed data
        const orderSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(typedData)])

        // Step 3: Create the order using RTK Query mutation (this will auto-invalidate and refetch the orders list)
        const result = await createOrderMutation({
          ...createSmartExitOrderParams,
          signature: orderSignature,
        }).unwrap()

        setState(SmartExitState.SUCCESS)

        trackingHandler(TRACKING_EVENT_TYPE.EARN_SMART_EXIT_CREATED, {
          ...getSmartExitTrackingPayload(),
          smart_exit_id: result.orderId || result.id,
          max_gas_value: opts.maxGas,
          max_gas_unit: 'percentage',
          completion_time_ms: Date.now(),
        })

        notify({
          type: NotificationType.SUCCESS,
          title: t`Smart Exit Order Created`,
          summary: t`Your smart exit order has been successfully created and is now active.`,
        })
        playSuccessSound()

        return !!(result.orderId || result.id)
      } catch (error) {
        const message = friendlyError(error)
        console.error('Smart exit order creation error:', { message, error })

        setState(SmartExitState.ERROR)

        trackingHandler(TRACKING_EVENT_TYPE.EARN_SMART_EXIT_FAILED, {
          ...getSmartExitTrackingPayload(),
          failure_reason: message,
          max_gas_value: opts.maxGas,
          max_gas_unit: 'percentage',
          completion_time_ms: Date.now(),
        })

        notify({
          title: t`Smart Exit Order Error`,
          summary: message,
          type: NotificationType.ERROR,
        })

        return false
      }
    },
    [
      account,
      baseParams,
      createOrderMutation,
      getSignMessage,
      getSmartExitTrackingPayload,
      library,
      notify,
      playSuccessSound,
      trackingHandler,
    ],
  )

  const estimateFee = useCallback(async (): Promise<SmartExitFee | null> => {
    if (!baseParams) return null

    try {
      const res = await estimateFeeMutation(baseParams).unwrap()
      const usd = Number((res as any)?.gas?.usd)
      const isValid = res && typeof (res as any).gas === 'object' && Number.isFinite(usd)

      if (!isValid) {
        console.error('Smart exit fee response invalid:', res)
        notify({
          title: t`Fee estimation unavailable`,
          summary: t`We could not read fee data from the server. Please try again.`,
          type: NotificationType.ERROR,
        })
        return null
      }

      const normalized: SmartExitFee = {
        ...(res as SmartExitFee),
        gas: { ...(res as any).gas, usd },
      }

      return normalized
    } catch (error) {
      const message = friendlyError(error)
      console.error('Smart exit fee estimation error:', { message, error })
      notify({
        title: t`Fee estimation failed`,
        summary: message,
        type: NotificationType.ERROR,
      })
      return null
    }
  }, [baseParams, estimateFeeMutation, notify])

  return {
    createSmartExitOrder,
    estimateFee,
    isCreating: state === SmartExitState.CREATING,
    isSuccess: state === SmartExitState.SUCCESS,
    isError: state === SmartExitState.ERROR,
  }
}
