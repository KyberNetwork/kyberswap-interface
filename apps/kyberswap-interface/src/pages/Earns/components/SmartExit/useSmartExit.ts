import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { useGetSmartExitSignMessageMutation } from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ParsedPosition } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'
import { friendlyError } from 'utils/errorMessage'

import { Metric } from './Metrics'

export interface SmartExitCondition {
  logical: {
    op: 'and' | 'or'
    conditions: Array<{
      field: {
        type: 'time' | 'pool_price' | 'fee_yield'
        value: any
      }
    }>
  }
}

export interface SmartExitOrderParams {
  chainId: number
  userWallet: string
  dexType: string
  poolId: string
  positionId: string
  removeLiquidity: string
  unwrap: boolean
  permitData: string
  condition: SmartExitCondition
  signature: string
  deadline: number
}

export interface UseSmartExitParams {
  position: ParsedPosition
  selectedMetrics: Metric[]
  conditionType: 'and' | 'or'
  feeYieldCondition: string
  priceCondition: { gte: string; lte: string }
  timeCondition: { time: number | null; condition: 'after' | 'before' }
  expireTime: number
  permitData?: string
  signature?: string
}

export enum SmartExitState {
  IDLE = 'idle',
  CREATING = 'creating',
  SUCCESS = 'success',
  ERROR = 'error',
}

// TODO: move to env
const SMART_EXIT_API_URL = 'https://pre-conditional-order.kyberengineering.io/api/v1/orders/smart-exit'

export const useSmartExit = ({
  position,
  selectedMetrics,
  conditionType,
  feeYieldCondition,
  priceCondition,
  timeCondition,
  expireTime,
  permitData,
  signature,
}: UseSmartExitParams) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const [state, setState] = useState<SmartExitState>(SmartExitState.IDLE)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [getSignMessage] = useGetSmartExitSignMessageMutation()

  const buildConditions = useCallback(() => {
    const conditions: Array<{
      field: {
        type: 'time' | 'pool_price' | 'fee_yield'
        value: any
      }
    }> = []

    // Add selected metric conditions
    selectedMetrics.forEach(metric => {
      switch (metric) {
        case Metric.FeeYield:
          if (feeYieldCondition) {
            conditions.push({
              field: {
                type: 'fee_yield',
                value: {
                  gte: parseFloat(feeYieldCondition),
                },
              },
            })
          }
          break

        case Metric.PoolPrice:
          if (priceCondition.gte && priceCondition.lte) {
            conditions.push({
              field: {
                type: 'pool_price',
                value: {
                  gte: parseFloat(priceCondition.gte),
                  lte: parseFloat(priceCondition.lte),
                },
              },
            })
          }
          break

        case Metric.Time:
          if (timeCondition.time) {
            const timeValue = Math.floor(timeCondition.time / 1000)
            if (timeCondition.condition === 'before') {
              conditions.push({
                field: {
                  type: 'time',
                  value: {
                    lte: timeValue,
                  },
                },
              })
            } else {
              conditions.push({
                field: {
                  type: 'time',
                  value: {
                    gte: timeValue,
                  },
                },
              })
            }
          }
          break
      }
    })

    return {
      logical: {
        op: conditionType,
        conditions,
      },
    }
  }, [selectedMetrics, conditionType, feeYieldCondition, priceCondition, timeCondition])

  // const getDexType = useCallback((dexId: string) => {
  //   // Map dex IDs to API format
  //   const dexMapping: Record<string, string> = {
  //     'uniswap-v3': 'uniswap-v3',
  //     'uniswap-v4': 'uniswap-v4',
  //   }
  //   return dexMapping[dexId] || dexId
  // }, [])

  const createSmartExitOrder = useCallback(async (): Promise<boolean> => {
    if (!account || !chainId || !permitData || !signature || !library) {
      console.error('Missing required data for smart exit order')
      return false
    }

    setState(SmartExitState.CREATING)
    console.log(position)

    try {
      // Step 1: Get sign message from API
      const signMessageParams = {
        chainId,
        userWallet: account,
        dexType: 'uniswap-v4',
        poolId: position.pool.address,
        positionId: position.tokenId,
        removeLiquidity: '297580968795', // TODO: Calculate actual liquidity amount
        unwrap: false,
        permitData,
        condition: buildConditions(),
      }

      console.log('Getting sign message with params:', signMessageParams)

      const signMessageResult = await getSignMessage(signMessageParams).unwrap()
      const typedData = signMessageResult.message

      if (!typedData || !typedData.domain || !typedData.types || !typedData.message) {
        throw new Error('Failed to get valid typed data from API')
      }

      // Step 2: Sign the typed data
      console.log('Signing typed data:', typedData)
      const orderSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(typedData)])

      // Step 3: Create the order with both signatures
      const orderParams: SmartExitOrderParams = {
        chainId,
        userWallet: account,
        dexType: 'uniswap-v4',
        poolId: position.pool.address,
        positionId: position.tokenId,
        removeLiquidity: '43819796429', // TODO: Calculate actual liquidity amount
        unwrap: false,
        permitData,
        condition: buildConditions(),
        signature: orderSignature,
        deadline: expireTime,
      }

      console.log('Creating smart exit order with params:', orderParams)

      const response = await fetch(SMART_EXIT_API_URL, {
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
      setOrderId(result.orderId || result.id)
      setState(SmartExitState.SUCCESS)

      notify({
        type: NotificationType.SUCCESS,
        title: t`Smart Exit Order Created`,
        summary: t`Your smart exit order has been successfully created and is now active.`,
      })

      return true
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
  }, [account, chainId, permitData, signature, position, buildConditions, notify, expireTime, library, getSignMessage])

  const reset = useCallback(() => {
    setState(SmartExitState.IDLE)
    setOrderId(null)
  }, [])

  return {
    state,
    orderId,
    createSmartExitOrder,
    reset,
    isCreating: state === SmartExitState.CREATING,
    isSuccess: state === SmartExitState.SUCCESS,
    isError: state === SmartExitState.ERROR,
  }
}
