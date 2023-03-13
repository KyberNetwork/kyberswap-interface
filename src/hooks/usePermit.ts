import { splitSignature } from '@ethersproject/bytes'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { defaultAbiCoder, parseUnits } from 'ethers/lib/utils'
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

// 24 hours
const PERMIT_VALIDITY_BUFFER = 24 * 60 * 60

export enum PermitState {
  NOT_APPLICABLE,
  NOT_SIGNED,
  SIGNED,
}

export const usePermit = (currencyAmount?: CurrencyAmount<Currency>, routerAddress?: string) => {
  const currency = currencyAmount?.currency.wrapped
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const dispatch = useDispatch()
  const eipContract = useContract(currency?.address, EIP_2612, false)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])

  const transactionDeadline = useTransactionDeadline()

  const permitData = usePermitData(currency?.address)

  // Manually fetch permit info from ks tokens
  const tokenV2 = useTokenV2(currency?.address)

  const permitState = useMemo(() => {
    if (!(tokenV2 as WrappedTokenInfo)?.domainSeparator) {
      return PermitState.NOT_APPLICABLE
    }
    if (
      permitData &&
      permitData.rawSignature &&
      transactionDeadline &&
      permitData.deadline >= transactionDeadline?.toNumber() &&
      currencyAmount?.equalTo(permitData?.value)
    ) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [permitData, transactionDeadline, tokenV2, currencyAmount])

  const signPermitCallback = useCallback(async (): Promise<void> => {
    if (
      !library ||
      !routerAddress ||
      !transactionDeadline ||
      !currency ||
      !account ||
      !(tokenV2 as WrappedTokenInfo)?.domainSeparator ||
      !tokenNonceState?.result?.[0]
    ) {
      return
    }
    if (permitState !== PermitState.NOT_SIGNED) {
      return
    }
    const deadline = transactionDeadline.toNumber() + PERMIT_VALIDITY_BUFFER
    const message = {
      owner: account,
      spender: routerAddress,
      value: parseUnits(currencyAmount.toExact(), currency.decimals).toString(),
      nonce: tokenNonceState.result[0].toNumber(),
      deadline: deadline,
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      domain: {
        name: currency.name,
        verifyingContract: currency.address,
        chainId,
        version: '1',
      },
      primaryType: 'Permit',
      message: message,
    })
    try {
      const signature = await library.send('eth_signTypedData_v4', [account, data]).then(res => splitSignature(res))
      const encodedPermitData = defaultAbiCoder.encode(
        ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
        [message.owner, message.spender, message.value, message.deadline, signature.v, signature.r, signature.s],
      )

      dispatch(
        permitUpdate({
          chainId: chainId,
          address: currency.address,
          rawSignature: encodedPermitData,
          deadline: message.deadline,
          value: message.value,
        }),
      )
    } catch (e) {
      console.log(e)
    }
  }, [
    account,
    chainId,
    library,
    permitState,
    routerAddress,
    currency,
    currencyAmount,
    transactionDeadline,
    dispatch,
    tokenV2,
    tokenNonceState.result,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
