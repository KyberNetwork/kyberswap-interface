import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ChainId, CurrencyAmount, Percent, Token as TokenSDK } from '@kyberswap/ks-sdk-core'
import { NonfungiblePositionManager, Pool, Position as PositionSDK } from '@kyberswap/ks-sdk-elastic'
import { captureException } from '@sentry/react'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useEffect, useRef, useState } from 'react'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { ErrorName } from 'utils/sentry'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { useMulticallContract } from './useContract'
import useTransactionDeadline from './useTransactionDeadline'

const tickReaderInterface = new Interface(TickReaderABI.abi)

export const config: {
  [chainId: number]: {
    subgraphUrl: string
    farmContract?: string
    positionManagerContract: string
    tickReaderContract: string
  }
} = {
  [ChainId.MAINNET]: {
    subgraphUrl:
      'https://ethereum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-ethereum-legacy',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.BSCMAINNET]: {
    subgraphUrl: 'https://bsc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bsc-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.ARBITRUM]: {
    subgraphUrl:
      'https://arbitrum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.AVAXMAINNET]: {
    subgraphUrl:
      'https://avalanche-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.OPTIMISM]: {
    subgraphUrl:
      'https://optimism-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-optimism-legacy',
    farmContract: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.MATIC]: {
    subgraphUrl:
      'https://polygon-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-polygon-legacy',
    farmContract: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
  [ChainId.FANTOM]: {
    subgraphUrl: 'https://fantom-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-fantom-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },

  [ChainId.BTTC]: {
    subgraphUrl: 'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bttc-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },

  [ChainId.CRONOS]: {
    subgraphUrl: 'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-cronos-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },

  [ChainId.VELAS]: {
    subgraphUrl: 'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-velas-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },

  [ChainId.OASIS]: {
    subgraphUrl: 'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-oasis-legacy',
    farmContract: '',
    positionManagerContract: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReaderContract: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
  },
}

const query = (user: string) => `
{
  depositedPositions(subgraphError: allow, first: 1000, where: {user: "${user.toLowerCase()}"}) {
    user
    farm {
      id
    }
    position {
      id
      owner
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
      token0 {
        id
        symbol
        decimals
        name
      }
      token1 {
        id
        symbol
        decimals
        name
      }
      pool {
        id
        feeTier
        sqrtPrice
        liquidity
        reinvestL
        tick
      }
    }
  }
  positions(subgraphError: allow, first: 1000, where: {owner: "${user.toLowerCase()}"}) {
    id
    liquidity
    owner
    tickLower {
      tickIdx
    }
    tickUpper {
      tickIdx
    }
    token0 {
      id
      symbol
      decimals
      name
    }
    token1 {
      id
      symbol
      decimals
      name
    }
    pool {
      id
      feeTier
      sqrtPrice
      liquidity
      reinvestL
      tick
    }
  }
}`

interface Token {
  id: string
  symbol: string
  decimals: string
  name: string
}
export interface Position {
  id: string
  owner: string
  liquidity: string
  token0: Token
  token1: Token
  tickLower: {
    tickIdx: string
  }
  tickUpper: {
    tickIdx: string
  }
  pool: {
    id: string
    feeTier: string
    sqrtPrice: string
    liquidity: string
    reinvestL: string
    tick: string
  }
}

export default function useElasticLegacy(interval = true) {
  const { chainId, account } = useActiveWeb3React()
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [farmPositions, setFarmPostions] = useState<Position[]>([])
  const previousChainIdRef = useRef(chainId)

  useEffect(() => {
    if (previousChainIdRef.current !== chainId || !account) {
      setPositions([])
      setFarmPostions([])
    }
    const getData = () => {
      if (!account || !config[chainId]) {
        setLoading(false)
        return
      }
      fetch(config[chainId].subgraphUrl, {
        method: 'POST',
        body: JSON.stringify({
          query: query(account),
        }),
      })
        .then(res => res.json())
        .then(
          (res: {
            data: {
              positions: Position[]
              depositedPositions: {
                user: string
                farm: { id: string }
                position: Position
              }[]
            }
          }) => {
            setPositions(res.data.positions)
            const farmPositions = res.data.depositedPositions.filter(
              item => item.farm.id === config[chainId].farmContract && item.user !== item.position.owner,
            )

            setFarmPostions(farmPositions.map(item => item.position))
          },
        )
        .finally(() => setLoading(false))
    }

    setLoading(true)
    getData()
    const i =
      interval &&
      setInterval(() => {
        getData()
      }, 15_000)

    return () => (i ? clearInterval(i) : undefined)
  }, [chainId, account, interval])

  useEffect(() => {
    previousChainIdRef.current = chainId
  }, [chainId])

  return {
    loading,
    positions: positions.filter(item => item.liquidity !== '0'),
    allPositions: positions,
    farmPositions,
  }
}

export function usePositionFees(positions: Position[]) {
  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.id]: ['0', '0'] }), {}))

  const multicallContract = useMulticallContract()

  const { chainId, networkInfo } = useActiveWeb3React()

  useEffect(() => {
    const getData = async () => {
      if (!multicallContract) return
      const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
      const callParams = positions.map(item => {
        return {
          target: (networkInfo as EVMNetworkInfo).elastic.tickReader,
          callData: tickReaderInterface.encodeFunctionData(fragment, [
            config[chainId].positionManagerContract,
            item.pool.id,
            item.id,
          ]),
        }
      })

      const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
      setFeeRewards(
        returnData.reduce(
          (
            acc: { [tokenId: string]: [string, string] },
            item: { success: boolean; returnData: string },
            index: number,
          ) => {
            if (item.success) {
              const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
              return {
                ...acc,
                [positions[index].id]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
              }
            }
            return { ...acc, [positions[index].id]: ['0', '0'] }
          },
          {} as { [tokenId: string]: [string, string] },
        ),
      )
    }

    getData()
    const i = setInterval(() => {
      getData()
    }, 10_000)

    return () => clearInterval(i)
    // eslint-disable-next-line
  }, [chainId, multicallContract, networkInfo, positions.length])

  return feeRewards
}

export const parsePosition = (item: Position, chainId: number, tokenPrices: { [key: string]: number }) => {
  const token0 = unwrappedToken(
    new TokenSDK(chainId, item.token0.id, Number(item.token0.decimals), item.token0.symbol, item.token0.name),
  )
  const token1 = unwrappedToken(
    new TokenSDK(chainId, item.token1.id, Number(item.token1.decimals), item.token1.symbol, item.token1.name),
  )

  const pool = new Pool(
    token0.wrapped,
    token1.wrapped,
    +item.pool.feeTier,
    item.pool.sqrtPrice,
    item.pool.liquidity,
    item.pool.reinvestL,
    +item.pool.tick,
  )

  const position = new PositionSDK({
    pool,
    liquidity: item.liquidity,
    tickLower: +item.tickLower.tickIdx,
    tickUpper: +item.tickUpper.tickIdx,
  })

  const usd =
    (tokenPrices[position.amount0.currency.wrapped.address] || 0) * +position.amount0.toExact() +
    (tokenPrices[position.amount1.currency.wrapped.address] || 0) * +position.amount1.toExact()

  return { token0, token1, pool, position, usd }
}

export const useRemoveLiquidityLegacy = (
  item: Position,
  tokenPrices: Record<string, number>,
  feeRewards: Record<string, [string, string]>,
) => {
  const { chainId, account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { token0, token1, position, usd } = parsePosition(item, chainId, tokenPrices)
  const feeValue0 = CurrencyAmount.fromRawAmount(unwrappedToken(token0), feeRewards[item.id][0])
  const feeValue1 = CurrencyAmount.fromRawAmount(unwrappedToken(token1), feeRewards[item.id][1])

  const [allowedSlippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline()

  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransactionWithType = useTransactionAdder()
  const [showPendingModal, setShowPendingModal] = useState<'collectFee' | 'removeLiquidity' | null>(null)

  const handleDismiss = () => {
    setShowPendingModal(null)
    setTxnHash('')
    setAttemptingTxn(false)
    setRemoveLiquidityError('')
  }

  const removeLiquidity = (collectFee: boolean) => {
    setShowPendingModal('removeLiquidity')
    setAttemptingTxn(true)
    if (!deadline || !account || !library) {
      setRemoveLiquidityError('Something went wrong!')
      return
    }
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
      tokenId: item.id,
      liquidityPercentage: new Percent('100', '100'),
      slippageTolerance: basisPointsToPercent(allowedSlippage),
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: collectFee
          ? feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage)))
          : CurrencyAmount.fromRawAmount(feeValue0.currency, 0),
        expectedCurrencyOwed1: collectFee
          ? feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage)))
          : CurrencyAmount.fromRawAmount(feeValue1.currency, 0),
        recipient: account,
        deadline: deadline.toString(),
        isRemovingLiquid: true,
        havingFee: collectFee && !(feeValue0.equalTo(JSBI.BigInt('0')) && feeValue1.equalTo(JSBI.BigInt('0'))),
      },
    })

    const txn = {
      to: config[chainId].positionManagerContract,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(async (estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            const tokenAmountIn = position.amount0.toSignificant(6)
            const tokenAmountOut = position.amount1.toSignificant(6)
            const tokenSymbolIn = token0.symbol
            const tokenSymbolOut = token1.symbol
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
              extraInfo: {
                tokenAmountIn,
                tokenAmountOut,
                tokenSymbolIn,
                tokenSymbolOut,
                tokenAddressIn: token0.wrapped.address,
                tokenAddressOut: token1.wrapped.address,
                contract: item.pool.id,
                nftId: item.id,
              },
            })
            setAttemptingTxn(false)
            setTxnHash(response.hash)
          })
      })
      .catch((error: any) => {
        setShowPendingModal('removeLiquidity')
        setAttemptingTxn(false)

        if (error?.code !== 'ACTION_REJECTED') {
          const e = new Error('Remove Legacy Elastic Liquidity Error', { cause: error })
          e.name = ErrorName.RemoveElasticLiquidityError
          captureException(e, {
            extra: {
              calldata,
              value,
              to: config[chainId].positionManagerContract,
            },
          })
        }

        setRemoveLiquidityError(error?.message || JSON.stringify(error))
      })
  }

  const collectFee = () => {
    setShowPendingModal('collectFee')
    setAttemptingTxn(true)

    if (!feeValue0 || !feeValue1 || !account || !library || !deadline) {
      setAttemptingTxn(false)
      setRemoveLiquidityError('Something went wrong!')
      return
    }

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: item.id,
      expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage))),
      expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage))),
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true,
      isPositionClosed: item.liquidity === '0',
      legacyMode: true,
    })

    const txn = {
      to: config[chainId].positionManagerContract,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            const tokenAmountIn = feeValue0?.toSignificant(6)
            const tokenAmountOut = feeValue1?.toSignificant(6)
            const tokenSymbolIn = feeValue0?.currency.symbol ?? ''
            const tokenSymbolOut = feeValue1?.currency.symbol ?? ''
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
              extraInfo: {
                tokenAmountIn,
                tokenAmountOut,
                tokenAddressIn: feeValue0?.currency.wrapped.address,
                tokenAddressOut: feeValue1?.currency.wrapped.address,
                tokenSymbolIn,
                tokenSymbolOut,
                arbitrary: {
                  token_1: tokenSymbolIn,
                  token_2: tokenSymbolOut,
                  token_1_amount: tokenAmountIn,
                  token_2_amount: tokenAmountOut,
                },
              },
            })
            setAttemptingTxn(false)
            setTxnHash(response.hash)
          })
      })
      .catch((error: any) => {
        setShowPendingModal('collectFee')
        setAttemptingTxn(false)
        setRemoveLiquidityError(error?.message || JSON.stringify(error))
        console.error(error)
      })
  }

  return {
    removeLiquidity,
    handleDismiss,
    removeLiquidityError,
    attemptingTxn,
    txnHash,
    showPendingModal,
    token0,
    token1,
    position,
    usd,
    feeValue1,
    feeValue0,
    collectFee,
  }
}
