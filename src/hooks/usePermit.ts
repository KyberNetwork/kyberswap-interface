import { Currency, MaxUint256 } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo, useState } from 'react'

import EIP_2612 from 'constants/abis/eip2612.json'
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
  NOT_SIGNED,
  SIGNED,
}

export const usePermit = (token?: Currency & { domainSeparator?: string }, routerAddress?: string) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const eipContract = useContract(token?.wrapped.address, EIP_2612, false)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])

  const transactionDeadline = useTransactionDeadline()

  const [signatureData, setSignatureData] = useState<{
    rawSignature: string
    deadline: number
  } | null>(null)

  const permitState = useMemo(() => {
    if (!token?.domainSeparator) {
      return PermitState.NOT_APPLICABLE
    }
    if (signatureData && transactionDeadline && signatureData.deadline >= transactionDeadline?.toNumber()) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [signatureData, transactionDeadline, token?.domainSeparator])

  const signPermitCallback = useCallback(async (): Promise<void> => {
    if (!library || !routerAddress || !transactionDeadline || !token) {
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
        verifyingContract: token.wrapped.address,
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
      const signature = await library.send('eth_signTypedData_v4', [account, data])
      setSignatureData({ rawSignature: signature, deadline: deadline })
    } catch (error) {
      // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
      if (error?.code !== 4001) {
        // approveCallback()
      }
    }
  }, [account, chainId, library, permitState, routerAddress, token, tokenNonceState.result, transactionDeadline])

  return { permitState, permitCallback: signPermitCallback, signatureData }
}
