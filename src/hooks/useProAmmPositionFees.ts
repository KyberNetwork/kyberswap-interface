import { computePoolAddress, NonfungiblePositionManager, Pool, Position, toHex } from '@vutien/dmm-v3-sdk'
import { Currency, CurrencyAmount, Percent, Token } from '@vutien/sdk-core'
import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { useProAmmPoolContract, useProAmmNFTPositionManagerContract } from './useContract'
import { abi as ProAmmPoolStateABI } from 'constants/abis/v2/ProAmmPoolState.json'
import { Interface } from 'ethers/lib/utils'
import {
  PRO_AMM_CORE_FACTORY_ADDRESSES,
  PRO_AMM_INIT_CODE_HASH,
  PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES
} from 'constants/v2'
import { unwrappedToken } from 'utils/wrappedCurrency'
import useTransactionDeadline from './useTransactionDeadline'
import { position } from 'polished'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent } from 'utils'
const POOL_STATE_INTERFACE = new Interface(ProAmmPoolStateABI)
const MAX_UINT128 = BigNumber.from(2)
  .pow(128)
  .sub(1)
export function useProAmmPositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  liquidity?: BigNumber,
  position?: Position,
  asWETH = false
) {
  const { account, chainId, library } = useActiveWeb3React()

  const positionManager = useProAmmNFTPositionManagerContract()
  const owner: string | undefined = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [
    tokenId?.toNumber()
  ]).result?.[0]

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>()

  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  useEffect(() => {
    let stale = false

    if (
      positionManager &&
      tokenIdHexString &&
      owner &&
      typeof latestBlockNumber === 'number' &&
      !!deadline &&
      !!chainId &&
      !!library &&
      !!position &&
      !!tokenId
    ) {
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
        tokenId: tokenId?.toString(),
        liquidityPercentage: new Percent(1, 100),
        slippageTolerance: basisPointsToPercent(allowedSlippage),
        deadline: deadline.toString()
      })
      const txn: { to: string; data: string; value: string } = {
        to: PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value
      }
      console.log('====vlllll', {
        tokenId: tokenId?.toString(),
        liquidityPercentage: new Percent(1, 100).toSignificant(10),
        slippageTolerance: basisPointsToPercent(allowedSlippage).toSignificant(10),
        deadline: deadline.toString()
      })
      library
        .getSigner()
        .estimateGas(txn)
        .then(estimate => {
          alert('asdsads')
        })
        .catch(console.log)
      // positionManager.callStatic
      //   .removeLiquidity(
      //     {
      //       tokenId: tokenIdHexString,
      //       liquidity: '0x9B415407B9B14',
      //       amount0Min: 0,
      //       amount1Min: 0,
      //       deadline: deadline.toNumber()
      //     },
      //     { from: owner } // need to simulate the call as the owner
      //   )
      // positionManager.callStatic
      //   .burnRTokens(
      //     {
      //       tokenId: tokenIdHexString,
      //       amount0Min: 0,
      //       amount1Min: 0,
      //       deadline: deadline.toNumber()
      //     },
      //     { from: owner } // need to simulate the call as the owner
      //   )
      // .then(results => {
      //   if (!stale) setAmounts([results.amount0, results.amount1])
      // })
      // .catch(console.log)
    }

    return () => {
      stale = true
    }
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber, deadline, chainId, library, position, tokenId])
  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token0) : pool.token0, amounts[0].toString()),
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token1) : pool.token1, amounts[1].toString())
    ]
  } else {
    return [undefined, undefined]
  }
}
