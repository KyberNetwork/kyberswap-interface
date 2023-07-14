import { splitSignature } from '@ethersproject/bytes'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { defaultAbiCoder, hexZeroPad, hexlify, parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import EIP_2612 from 'constants/abis/eip2612.json'
import { EIP712_DOMAIN_TYPE, EIP712_DOMAIN_TYPE_SALT, PERMITTABLE_TOKENS, PermitType } from 'constants/permit'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { permitUpdate } from 'state/user/actions'
import { usePermitData } from 'state/user/hooks'

import { useContract } from './useContract'
import useMixpanel, { MIXPANEL_TYPE } from './useMixpanel'
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
  const notify = useNotify()
  const eipContract = useContract(currency?.address, EIP_2612, false)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])

  const transactionDeadline = useTransactionDeadline()

  const permitData = usePermitData(currency?.address)

  const { mixpanelHandler } = useMixpanel()
  const overwritedPermitData = currency && PERMITTABLE_TOKENS[chainId]?.[currency.address]

  const permitState = useMemo(() => {
    if (!overwritedPermitData) {
      return PermitState.NOT_APPLICABLE
    }
    if (permitData?.errorCount !== undefined && permitData?.errorCount >= 3) return PermitState.NOT_APPLICABLE
    if (
      permitData &&
      permitData.rawSignature &&
      transactionDeadline &&
      permitData.deadline &&
      permitData.deadline >= Date.now() / 1000 &&
      permitData.value !== undefined &&
      currencyAmount?.equalTo(permitData.value)
    ) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [permitData, transactionDeadline, currencyAmount, overwritedPermitData])
  const prevErrorCount = usePrevious(permitData?.errorCount)
  useEffect(() => {
    if (prevErrorCount === 2 && permitData?.errorCount === 3) {
      notify(
        {
          type: NotificationType.ERROR,
          title: t`Permit Error`,
          summary: t`An error occurred while attempting to authorize this token. Please approve it normally instead.`,
        },
        10000,
      )
      if (currency) {
        mixpanelHandler(MIXPANEL_TYPE.PERMIT_FAILED_TOO_MANY_TIMES, {
          symbol: currency.symbol,
          address: currency.address,
        })
      }
    }
  }, [permitData?.errorCount, notify, mixpanelHandler, currency, prevErrorCount])
  const signPermitCallback = useCallback(async (): Promise<void> => {
    if (
      !library ||
      !routerAddress ||
      !transactionDeadline ||
      !currency ||
      !account ||
      !overwritedPermitData ||
      !tokenNonceState?.result?.[0]
    ) {
      return
    }
    if (permitState !== PermitState.NOT_SIGNED) {
      return
    }
    const deadline = Math.floor(Date.now() / 1000) + PERMIT_VALIDITY_BUFFER
    const message = {
      owner: account,
      spender: routerAddress,
      value: parseUnits(currencyAmount.toExact(), currency.decimals).toString(),
      nonce: tokenNonceState.result[0].toNumber(),
      deadline: deadline,
    }

    const data = JSON.stringify({
      types: {
        EIP712Domain:
          overwritedPermitData && overwritedPermitData.type === PermitType.SALT
            ? EIP712_DOMAIN_TYPE_SALT
            : EIP712_DOMAIN_TYPE,
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
      domain:
        overwritedPermitData && overwritedPermitData.type === PermitType.SALT
          ? {
              name: currency.name,
              verifyingContract: currency.address,
              salt: hexZeroPad(hexlify(chainId), 32),
              version: '1',
            }
          : {
              name: currency.name,
              verifyingContract: currency.address,
              version: '1',
              chainId,
            },
      primaryType: 'Permit',
      message: message,
    })
    try {
      const signature = await library
        .send('eth_signTypedData_v4', [account.toLowerCase(), data])
        .then((res: any) => splitSignature(res))
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
          account: account,
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
    tokenNonceState.result,
    overwritedPermitData,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
