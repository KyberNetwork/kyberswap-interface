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
import { useProAmmPositionsFromTokenId } from './useProAmmPositions'
import { useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import { useProAmmTotalFeeOwedByPosition } from './useProAmmPreviousTicks'
const POOL_STATE_INTERFACE = new Interface(ProAmmPoolStateABI)
const MAX_UINT128 = BigNumber.from(2)
  .pow(128)
  .sub(1)
export function useProAmmPositionFees(tokenId?: BigNumber, position?: Position, asWETH = false) {
  const positionManager = useProAmmNFTPositionManagerContract()
  const tokenIdHexString = tokenId?.toHexString()
  const amounts = useProAmmTotalFeeOwedByPosition(position?.pool, tokenIdHexString)
  if (position && amounts.length == 2) {
    return [
      CurrencyAmount.fromRawAmount(
        !asWETH ? unwrappedToken(position?.pool.token0) : position?.pool.token0,
        amounts[0].toString()
      ),
      CurrencyAmount.fromRawAmount(
        !asWETH ? unwrappedToken(position?.pool.token1) : position?.pool.token1,
        amounts[1].toString()
      )
    ]
  } else return [undefined, undefined]
}
