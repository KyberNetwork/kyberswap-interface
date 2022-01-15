import { BigNumber } from '@ethersproject/bignumber'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'

import { useProAmmNFTPositionManagerContract } from './useContract'

type TokenId = number | JSBI | BigNumber

const STARTS_WITH = 'data:application/json;base64,'

type UsePositionTokenURIResult =
  | {
      valid: true
      loading: false
      result: {
        name: string
        description: string
        image: string
      }
    }
  | {
      valid: false
      loading: false
    }
  | {
      valid: true
      loading: true
    }

export function useProAmmPositionTokenURI(tokenId: TokenId | undefined): UsePositionTokenURIResult {
  const contract = useProAmmNFTPositionManagerContract()
  const inputs = useMemo(() => [tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)], [
    tokenId
  ])
  const { result, error, loading, valid } = useSingleCallResult(contract, 'tokenURI', inputs, {
    ...NEVER_RELOAD,
    gasRequired: 3_000_000
  })
}
