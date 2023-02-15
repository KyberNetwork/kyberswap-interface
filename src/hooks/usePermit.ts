import { MaxUint256, Token } from '@kyberswap/ks-sdk-core'
import { splitSignature } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'

import EIP_2612 from 'constants/abis/eip2612.json'
import { PERMIT_SUPPORTED_TOKENS } from 'constants/permitSupported'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useSingleCallResult } from 'state/multicall/hooks'

import { useContract } from './useContract'
import useTransactionDeadline from './useTransactionDeadline'

const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
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
  LOADING,
  NOT_SIGNED,
  SIGNED,
}

export const usePermit = (token?: Token, routerAddress?: string) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const eipContract = useContract(token?.address, EIP_2612, false)
  const nonceInputs = useMemo(() => [account ?? undefined], [account])
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', nonceInputs)
  console.log('🚀 ~ file: usePermit.ts:43 ~ usePermit ~ tokenNonceState', tokenNonceState)

  const transactionDeadline = useTransactionDeadline()

  const [signatureData, setSignatureData] = useState<{
    v: number
    r: string
    s: string
    deadline: number
  } | null>(null)

  const permitState = useMemo(() => {
    if (tokenNonceState.loading) {
      return PermitState.LOADING
    }
    if (!tokenNonceState.valid || !tokenNonceState.result) {
      return PermitState.NOT_APPLICABLE
    }
    if (signatureData && transactionDeadline && signatureData.deadline >= transactionDeadline?.toNumber()) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [tokenNonceState.loading, tokenNonceState.valid, tokenNonceState.result, signatureData, transactionDeadline])

  const signPermitCallback = useCallback(async (): Promise<void> => {
    if (!library || !routerAddress || !transactionDeadline || !token || !eipContract) {
      return
    }
    if (permitState !== PermitState.NOT_SIGNED) {
      return
    }
    const deadline = transactionDeadline.toNumber() + PERMIT_VALIDITY_BUFFER
    const data = JSON.stringify({
      types: {
        EIP712Domain: EIP712_DOMAIN_TYPE,
        Permit: EIP2612_TYPE,
      },
      domain: {
        name: token.name,
        verifyingContract: token.address,
        chainId,
      },
      primaryType: 'Permit',
      message: {
        owner: account,
        spender: routerAddress,
        value: MaxUint256.toString(),
        nonce: tokenNonceState.result?.[0].toNumber(),
        deadline: deadline,
      },
    })
    try {
      const signature = await library.send('eth_signTypedData_v4', [account, data]).then(splitSignature)
      setSignatureData({
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline: deadline,
      })
      const res = await eipContract.permit(
        account,
        routerAddress,
        MaxUint256.toString(),
        deadline,
        signature.v,
        signature.r,
        signature.s,
      )
      console.log('🚀 ~ file: usePermit.ts:111 ~ signPermitCallback ~ res', res)
    } catch (error) {
      console.log('🚀 ~ file: usePermit.ts:105 ~ permitCallback ~ error', error)
      // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
      if (error?.code !== 4001) {
        // approveCallback()
      }
    }
  }, [
    account,
    chainId,
    library,
    eipContract,
    permitState,
    routerAddress,
    token,
    tokenNonceState.result,
    transactionDeadline,
  ])
  const permit = useCallback(async () => {
    if (!eipContract || !signatureData) return
    try {
      await eipContract.permit({
        owner: account,
        spender: routerAddress,
        value: MaxUint256.toString(),
        deadline: signatureData.deadline,
        v: signatureData.v,
        s: signatureData.s,
        r: signatureData.r,
      })
    } catch (error) {
      console.log(error)
    }
  }, [account, routerAddress, signatureData, eipContract])

  return { permitState, permitCallback: signPermitCallback, permit }
}
