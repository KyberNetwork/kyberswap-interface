import { computePoolAddress, Pool, toHex } from '@vutien/dmm-v3-sdk'
import { Currency, CurrencyAmount, Token } from '@vutien/sdk-core'
import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { useProAmmPoolContract, useProAmmNFTPositionManagerContract } from './useContract'
import { abi as ProAmmPoolStateABI } from 'constants/abis/v2/ProAmmPoolState.json'
import { Interface } from 'ethers/lib/utils'
import { PRO_AMM_CORE_FACTORY_ADDRESSES, PRO_AMM_INIT_CODE_HASH } from 'constants/v2'
import { unwrappedToken } from 'utils/wrappedCurrency'
import useTransactionDeadline from './useTransactionDeadline'
const POOL_STATE_INTERFACE = new Interface(ProAmmPoolStateABI)
const MAX_UINT128 = BigNumber.from(2)
  .pow(128)
  .sub(1)
export function useProAmmPositionFees(pool?: Pool, tokenId?: BigNumber, asWETH = false) {
  const { account, chainId } = useActiveWeb3React()

  const positionManager = useProAmmNFTPositionManagerContract()
  const owner: string | undefined = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [
    tokenId?.toNumber()
  ]).result?.[0]

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>()

  const deadline = useTransactionDeadline()
  useEffect(() => {
    let stale = false

    if (positionManager && tokenIdHexString && owner && typeof latestBlockNumber === 'number' && !!deadline) {
      positionManager.callStatic
        .burnRTokens(
          {
            tokenId: tokenIdHexString,
            amount0Min: 0,
            amount1Min: 0,
            deadline: deadline.toNumber()
          },
          { from: owner } // need to simulate the call as the owner
        )
        .then(results => {
          if (!stale) setAmounts([results.amount0, results.amount1])
        })
        .catch(console.log)
    }

    return () => {
      stale = true
    }
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber, deadline])
  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token0) : pool.token0, amounts[0].toString()),
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token1) : pool.token1, amounts[1].toString())
    ]
  } else {
    return [undefined, undefined]
  }
}
