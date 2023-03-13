import { splitSignature } from '@ethersproject/bytes'
import { Currency, MaxUint256 } from '@kyberswap/ks-sdk-core'
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import EIP_2612 from 'constants/abis/eip2612.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { permitUpdate } from 'state/user/actions'
import { usePermitData } from 'state/user/hooks'

import { WrappedTokenInfo } from './../state/lists/wrappedTokenInfo'
import { useTokenV2 } from './Tokens'
import { useContract } from './useContract'
import useTransactionDeadline from './useTransactionDeadline'

const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'version', type: 'string' },
]
const EIP2612_TYPE = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
]

// 24 hours
const PERMIT_VALIDITY_BUFFER = 2 * 60

export enum PermitState {
  NOT_APPLICABLE,
  NOT_SIGNED,
  SIGNED,
}

export const usePermit = (token?: Currency & { domainSeparator?: string }, routerAddress?: string) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const eipContract = useContract(token?.wrapped.address, EIP_2612, false)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])
  const dispatch = useDispatch()
  const transactionDeadline = useTransactionDeadline()

  const permitData = usePermitData(token?.wrapped.address)
  // Manually fetch permit info from ks tokens
  const tokenV2 = useTokenV2(token?.wrapped.address)
  const permitState = useMemo(() => {
    if (!(tokenV2 as WrappedTokenInfo)?.domainSeparator) {
      return PermitState.NOT_APPLICABLE
    }
    if (
      permitData &&
      permitData.rawSignature &&
      transactionDeadline &&
      permitData.deadline >= transactionDeadline?.toNumber()
    ) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [permitData, transactionDeadline, tokenV2])

  const signPermitCallback = useCallback(async (): Promise<void> => {
    if (!library || !routerAddress || !transactionDeadline || !token || !account) {
      return
    }
    if (permitState !== PermitState.NOT_SIGNED) {
      return
    }
    const deadline = transactionDeadline.toNumber() + PERMIT_VALIDITY_BUFFER
    const PERMIT_TYPEHASH = keccak256(
      'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)',
    )
    const a = keccak256(
      defaultAbiCoder.encode(
        ['address', 'address', 'uint256', 'uint256'],
        [account.toLowerCase(), routerAddress, MaxUint256.toString(), deadline],
      ),
    )
    const data = JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Permit: EIP2612_TYPE,
      },
      domain: {
        name: token.name,
        verifyingContract: token.wrapped.address,
        chainId,
        version: '1',
      },
      primaryType: 'Permit',
      message: {
        owner: account.toLowerCase(),
        spender: routerAddress,
        value: MaxUint256.toString(),
        nonce: tokenNonceState.result?.[0].toNumber(),
        deadline: deadline,
      },
    })
    try {
      const signature = await library
        .send('eth_signTypedData_v4', [account.toLowerCase(), data])
        .then(res => splitSignature(res))
      const result = defaultAbiCoder.encode(
        ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
        [account.toLowerCase(), routerAddress, MaxUint256.toString(), deadline, signature.v, signature.r, signature.s],
      )

      dispatch(
        permitUpdate({
          chainId: chainId,
          address: token.wrapped.address,
          rawSignature: result,
          deadline: deadline,
        }),
      )
    } catch (error) {
      // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
      if (error?.code !== 4001) {
        // approveCallback()
      }
    }
  }, [
    account,
    chainId,
    library,
    permitState,
    routerAddress,
    token,
    tokenNonceState.result,
    transactionDeadline,
    dispatch,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
