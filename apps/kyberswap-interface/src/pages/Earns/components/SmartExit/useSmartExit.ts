import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SmartExitFeeParams,
  useEstimateSmartExitFeeMutation,
  useGetSmartExitSignMessageMutation,
} from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { SMART_EXIT_API_URL } from 'constants/env'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useSuccessSound } from 'hooks/useSuccessSound'
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
  const playSuccessSound = useSuccessSound()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [state, setState] = useState<SmartExitState>(SmartExitState.IDLE)
  const [positionLiquidity, setPositionLiquidity] = useState<string | null>(null)
  const [getSignMessage] = useGetSmartExitSignMessageMutation()
  const [estimateFeeMutation] = useEstimateSmartExitFeeMutation()

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
      condition: buildConditions(selectedMetrics.filter(metric => metric !== null) as SelectedMetric[], conditionType),
      deadline,
    }
  }, [account, conditionType, deadline, dexType, position, positionLiquidity, selectedMetrics])

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

        // Step 3: Create the order with both signatures
        const orderParams: SmartExitFeeParams & { permitData: string; signature: string; maxGasPercentage: number } = {
          ...createSmartExitOrderParams,
          signature: orderSignature,
        }

        const response = await fetch(`${SMART_EXIT_API_URL}/v1/orders/smart-exit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderParams),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setState(SmartExitState.SUCCESS)

        notify({
          type: NotificationType.SUCCESS,
          title: t`Smart Exit Order Created`,
          summary: t`Your smart exit order has been successfully created and is now active.`,
        })
        playSuccessSound()

        return result.orderId || result.id
      } catch (error) {
        const message = friendlyError(error)
        console.error('Smart exit order creation error:', { message, error })

        setState(SmartExitState.ERROR)
        notify({
          title: t`Smart Exit Order Error`,
          summary: message,
          type: NotificationType.ERROR,
        })

        return false
      }
    },
    [account, baseParams, getSignMessage, library, notify, playSuccessSound],
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
