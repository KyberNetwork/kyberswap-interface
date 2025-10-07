import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { useGetSmartExitSignMessageMutation } from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import { DexType } from 'pages/Earns/SmartExit/useSmartExitFilter'
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

// Position Manager ABI for liquidity fetching
const POSITION_MANAGER_ABI = [
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)', // V3
  'function getPositionLiquidity(uint256 tokenId) view returns (uint128 liquidity)', // V4
]

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

  const getDexType = useCallback((dexId: string) => {
    // Map dex IDs to API format
    const dexMapping: Record<string, string> = {
      'Uniswap V3': DexType.DexTypeUniswapV3,
      'Uniswap V4': DexType.DexTypeUniswapV4,
      'Uniswap V4 FairFlow': DexType.DexTypeUniswapV4FairFlow,
    }
    return dexMapping[dexId] || dexId
  }, [])

  // Detect version from dex type
  const dexType = getDexType(position.dex.id)

  // Contract setup for liquidity fetching
  const positionContract = useReadingContract(position.id.split('-')[0], POSITION_MANAGER_ABI)

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

  const createSmartExitOrder = useCallback(async (): Promise<boolean> => {
    if (!account || !chainId || !permitData || !signature || !library || !positionContract) {
      console.error('Missing required data for smart exit order')
      return false
    }
    let liquidity = ''
    if (dexType === 'uniswap-v3') {
      const res = await positionContract.positions(position.tokenId)
      liquidity = res.liquidity.toString()
    } else {
      const res = await positionContract.getPositionLiquidity(position.tokenId)
      liquidity = res.toString()
    }

    if (!liquidity) {
      console.log("Can't get liquidity of position")
      return false
    }

    setState(SmartExitState.CREATING)

    try {
      // Step 1: Get sign message from API
      const signMessageParams = {
        chainId,
        userWallet: account,
        dexType: getDexType(position.dex.id),
        poolId: position.pool.address,
        positionId: position.id,
        removeLiquidity: liquidity,
        unwrap: true,
        permitData,
        condition: buildConditions(),
        deadline: expireTime,
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
        dexType: dexType,
        poolId: position.pool.address,
        positionId: position.id,
        removeLiquidity: liquidity,
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
  }, [
    account,
    chainId,
    permitData,
    signature,
    position,
    buildConditions,
    notify,
    expireTime,
    library,
    getSignMessage,
    getDexType,
    dexType,
    positionContract,
  ])

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
