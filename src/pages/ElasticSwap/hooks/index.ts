import { Currency, CurrencyAmount, Token, TradeType } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Route, SwapQuoter, SwapRouter, Trade, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { BigNumber, Contract } from 'ethers'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { abi as QuoterABI } from 'constants/abis/v2/ProAmmQuoter.json'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllCurrencyCombinations } from 'hooks/useAllCurrencyCombinations'
import { useContractForReading } from 'hooks/useContract'
import { PoolState, usePools } from 'hooks/usePools'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useSingleContractWithCallData } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { getContract } from 'utils/getContract'
import isZero from 'utils/isZero'

const ROUTER_PRO_AMM = [
  {
    inputs: [
      { internalType: 'address', name: '_factory', type: 'address' },
      { internalType: 'address', name: '_WETH', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'WETH',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes[]', name: 'data', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ internalType: 'bytes[]', name: 'results', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  { inputs: [], name: 'refundEth', outputs: [], stateMutability: 'payable', type: 'function' },
  {
    inputs: [
      { internalType: 'int256', name: 'deltaQty0', type: 'int256' },
      { internalType: 'int256', name: 'deltaQty1', type: 'int256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'swapCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'bytes', name: 'path', type: 'bytes' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'minAmountOut', type: 'uint256' },
        ],
        internalType: 'struct IRouter.ExactInputParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'swapExactInput',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'minAmountOut', type: 'uint256' },
          { internalType: 'uint160', name: 'limitSqrtP', type: 'uint160' },
        ],
        internalType: 'struct IRouter.ExactInputSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'swapExactInputSingle',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'bytes', name: 'path', type: 'bytes' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
          { internalType: 'uint256', name: 'maxAmountIn', type: 'uint256' },
        ],
        internalType: 'struct IRouter.ExactOutputParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'swapExactOutput',
    outputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
          { internalType: 'uint256', name: 'maxAmountIn', type: 'uint256' },
          { internalType: 'uint160', name: 'limitSqrtP', type: 'uint160' },
        ],
        internalType: 'struct IRouter.ExactOutputSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'swapExactOutputSingle',
    outputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'transferAllTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'feeUnits', type: 'uint256' },
      { internalType: 'address', name: 'feeRecipient', type: 'address' },
    ],
    name: 'transferAllTokensWithFee',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'unwrapWeth',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'feeUnits', type: 'uint256' },
      { internalType: 'address', name: 'feeRecipient', type: 'address' },
    ],
    name: 'unwrapWethWithFee',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
]

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

export function useElasticBestTrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
): {
  state: TradeState
  trade: Trade<Currency, Currency, TradeType> | undefined
} {
  const { networkInfo } = useActiveWeb3React()
  const [currencyIn, currencyOut] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [tradeType, amountSpecified, otherCurrency],
  )
  const { routes, loading: routesLoading } = useElasticAllRoutes(currencyIn, currencyOut)

  const quoter = useContractForReading((networkInfo as EVMNetworkInfo).elastic.quoter, QuoterABI)

  const quotesResults = useSingleContractWithCallData(
    quoter,
    amountSpecified
      ? routes.map(route => SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType).calldata)
      : [],
    {
      gasRequired: 2_000_000,
    },
  )

  return useMemo(() => {
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: TradeState.LOADING,
        trade: undefined,
      }
    }
    const { bestRoute, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          bestRoute: Route<Currency, Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result },
        i,
      ) => {
        if (!result || !result[0]) return currentBest
        const res = result[0]
        if (!result[0]) return currentBest
        // overwrite the current best if it's not defined or if this route is better
        if (tradeType === TradeType.EXACT_INPUT) {
          const amountOut = CurrencyAmount.fromRawAmount(currencyOut, res.returnedAmount.toString())
          if (currentBest.amountOut === null || JSBI.lessThan(currentBest.amountOut.quotient, amountOut.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn: amountSpecified,
              amountOut,
            }
          }
        } else {
          const amountIn = CurrencyAmount.fromRawAmount(currencyIn, res.returnedAmount.toString())
          if (currentBest.amountIn === null || JSBI.greaterThan(currentBest.amountIn.quotient, amountIn.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn,
              amountOut: amountSpecified,
            }
          }
        }
        return currentBest
      },
      {
        bestRoute: null,
        amountIn: null,
        amountOut: null,
      },
    )

    if (!bestRoute || !amountIn || !amountOut) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }
    return {
      state: TradeState.VALID,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        inputAmount: amountIn,
        outputAmount: amountOut,
        tradeType,
      }),
    }
  }, [amountSpecified, currencyIn, currencyOut, quotesResults, routes, routesLoading, tradeType])
}

function poolEquals(poolA: Pool, poolB: Pool): boolean {
  return (
    poolA === poolB ||
    (poolA.token0.equals(poolB.token0) && poolA.token1.equals(poolB.token1) && poolA.fee === poolB.fee)
  )
}

function computeAllRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  pools: Pool[],
  chainId: number,
  currentPath: Pool[] = [],
  allPaths: Route<Currency, Currency>[] = [],
  startCurrencyIn: Currency = currencyIn,
  maxHops = 2,
): Route<Currency, Currency>[] {
  const tokenIn = currencyIn?.wrapped
  const tokenOut = currencyOut?.wrapped
  if (!tokenIn || !tokenOut) throw new Error('Missing tokenIn/tokenOut')

  for (const pool of pools) {
    if (!pool.involvesToken(tokenIn) || currentPath.find(pathPool => poolEquals(pool, pathPool))) continue

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0
    if (outputToken.equals(tokenOut)) {
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut))
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        currencyOut,
        pools,
        chainId,
        [...currentPath, pool],
        allPaths,
        startCurrencyIn,
        maxHops - 1,
      )
    }
  }

  return allPaths
}

function useElasticAllRoutes(
  currencyIn?: Currency,
  currencyOut?: Currency,
): { loading: boolean; routes: Route<Currency, Currency>[] } {
  const { chainId } = useActiveWeb3React()
  const { pools, loading: poolsLoading } = useProAmmSwapPools(currencyIn, currencyOut)
  return useMemo(() => {
    if (poolsLoading || !chainId || !pools || !currencyIn || !currencyOut) return { loading: true, routes: [] }

    const routes = computeAllRoutes(currencyIn, currencyOut, pools, chainId, [], [], currencyIn, 1)

    return { loading: false, routes }
  }, [chainId, currencyIn, currencyOut, pools, poolsLoading])
}

function useProAmmSwapPools(
  currencyIn?: Currency,
  currencyOut?: Currency,
): {
  pools: Pool[]
  loading: boolean
} {
  const { networkInfo } = useActiveWeb3React()
  const [searchParams] = useSearchParams()
  const pool = searchParams.get('pool')
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut)
  const allCurrencyCombinationsWithAllFees: [Token, Token, FeeAmount][] = useMemo(
    () =>
      allCurrencyCombinations.reduce<[Token, Token, FeeAmount][]>((list, [tokenA, tokenB]) => {
        return list.concat([
          [tokenA, tokenB, FeeAmount.RARE],
          [tokenA, tokenB, FeeAmount.EXOTIC],
          [tokenA, tokenB, FeeAmount.STABLE],
          [tokenA, tokenB, FeeAmount.VOLATILE],
          [tokenA, tokenB, FeeAmount.MOST_PAIR],
          [tokenA, tokenB, FeeAmount.MOST_PAIR1],
          [tokenA, tokenB, FeeAmount.MOST_PAIR2],
          [tokenA, tokenB, FeeAmount.VERY_STABLE],
          [tokenA, tokenB, FeeAmount.VERY_STABLE1],
          [tokenA, tokenB, FeeAmount.VERY_STABLE2],
        ])
      }, []),
    [allCurrencyCombinations],
  )
  const pools = usePools(allCurrencyCombinationsWithAllFees)

  const initCodeHash = (networkInfo as EVMNetworkInfo).elastic.initCodeHash
  const factoryAddress = (networkInfo as EVMNetworkInfo).elastic.coreFactory

  return useMemo(() => {
    return {
      pools: pools
        .filter((tuple): tuple is [PoolState.EXISTS, Pool] => {
          return tuple[0] === PoolState.EXISTS && tuple[1] !== null
        })
        .filter(t => {
          if (pool) {
            const p = t[1]
            return (
              computePoolAddress({
                factoryAddress,
                tokenA: p.token0,
                tokenB: p.token1,
                fee: p.fee,
                initCodeHashManualOverride: initCodeHash,
              }).toLowerCase() === pool.toLowerCase()
            )
          } else return true
        })
        .map(([, pool]) => pool),
      loading: pools.some(([state]) => state === PoolState.LOADING),
    }
  }, [pools, pool, initCodeHash, factoryAddress])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
): { callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage)

  const addTransactionWithType = useTransactionAdder()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null, error: 'Missing dependencies' }
    }

    return {
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map(call => {
            const { address, calldata, value } = call
            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                  }

            return library
              .estimateGas(tx)
              .then(gasEstimate => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch(gasError => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)
                // reportException(new Error('Gas estimate failed, trying eth_call to extract error'))

                return library
                  .call(tx)
                  .then(result => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    // reportException(new Error('Unexpected successful call after failed estimate gas'))
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch(callError => {
                    console.debug('Call threw error', call, callError)
                    // reportException(callError)
                    let errorMessage: string
                    switch (callError.message) {
                      case 'execution reverted: DmmExchangeRouter: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'execution reverted: DmmExchangeRouter: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                        break
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${callError.message}. This is probably an issue with one of the tokens you are swapping.`
                    }
                    return { call, error: new Error(errorMessage) }
                  })
              })
          }),
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        const successfulEstimation = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]),
        )
        // return new Promise((resolve, reject) => resolve(""))
        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        const {
          call: { address, calldata, value },
        } = successfulEstimation

        return library
          .getSigner()
          .sendTransaction({
            from: account,
            to: address,
            data: calldata,
            // let the wallet try if we can't estimate the gas
            ...('gasEstimate' in successfulEstimation
              ? { gasLimit: calculateGasMargin(successfulEstimation.gasEstimate) }
              : {}),
            ...(value && !isZero(value) ? { value } : {}),
          })
          .then((response: any) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = formatCurrencyAmount(trade.inputAmount, 6)
            const outputAmount = formatCurrencyAmount(trade.outputAmount, 6)

            const summary = `${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            addTransactionWithType({
              ...response,
              type: TRANSACTION_TYPE.SWAP,
              hash: response.hash,
              summary,
            })

            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, address, calldata, value)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
      },
      error: null,
    }
  }, [trade, library, account, chainId, swapCalls, addTransactionWithType])
}

interface SwapCall {
  address: string
  calldata: string
  value: string
}

interface SuccessfulCall {
  call: SwapCall
  gasEstimate: BigNumber
}

interface FailedCall {
  call: SwapCall
  error: Error
}

type EstimatedSwapCall = SuccessfulCall | FailedCall

function useSwapCallArguments(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage = INITIAL_ALLOWED_SLIPPAGE,
): SwapCall[] {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()

  const deadline = useTransactionDeadline()

  return useMemo(() => {
    if (!trade || !account || !library || !account || !chainId || !deadline) return []

    const routerProAmmContract: Contract | null = getContract(
      (networkInfo as EVMNetworkInfo).elastic.routers,
      ROUTER_PRO_AMM,
      library,
      account,
    )
    if (!routerProAmmContract) return []
    const options = {
      recipient: account,
      slippageTolerance: basisPointsToPercent(allowedSlippage),
      deadline: deadline.toString(),
    }

    const { value, calldata } = SwapRouter.swapCallParameters([trade], options)
    return [
      {
        address: routerProAmmContract.address,
        calldata,
        value,
      },
    ]
  }, [networkInfo, allowedSlippage, chainId, deadline, library, account, trade])
}
