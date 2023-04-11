import { splitSignature } from '@ethersproject/bytes'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { defaultAbiCoder, parseUnits } from 'ethers/lib/utils'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { NotificationType } from 'components/Announcement/type'
import EIP_2612 from 'constants/abis/eip2612.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { permitError, permitUpdate } from 'state/user/actions'
import { usePermitData } from 'state/user/hooks'

import { WrappedTokenInfo } from './../state/lists/wrappedTokenInfo'
import { useTokenV2 } from './Tokens'
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

  // Manually fetch permit info from ks tokens
  const tokenV2 = useTokenV2(currency?.address)

  const { mixpanelHandler } = useMixpanel()

  const permitState = useMemo(() => {
    if (!(tokenV2 as WrappedTokenInfo)?.domainSeparator) {
      return PermitState.NOT_APPLICABLE
    }
    if (permitData?.errorCount !== undefined && permitData?.errorCount >= 3) return PermitState.NOT_APPLICABLE
    if (
      permitData &&
      permitData.rawSignature &&
      transactionDeadline &&
      permitData.deadline &&
      permitData.deadline >= transactionDeadline?.toNumber() &&
      permitData.value !== undefined &&
      currencyAmount?.equalTo(permitData.value)
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
    // TODO: REMOVE later
    if (chainId === ChainId.MATIC && currency.address.toLowerCase() === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174') {
      if (permitData?.errorCount !== undefined && permitData?.errorCount === 2) {
        notify(
          {
            type: NotificationType.ERROR,
            title: t`Permit Failed`,
            summary: t`An error occurred while attempting to authorize this token. Instead, please approve normally.`,
          },
          10000,
        )
        mixpanelHandler(MIXPANEL_TYPE.PERMIT_FAILED_TOO_MANY_TIMES, {
          symbol: currency.symbol,
          address: currency.address,
        })
      }
      dispatch(permitError({ chainId, address: currency.address, account }))
    } else {
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
            account: account,
          }),
        )
      } catch (error) {
        if (error?.code !== 4001) {
          // exceeded 3 times error
          if (permitData?.errorCount !== undefined && permitData?.errorCount === 2) {
            notify(
              {
                type: NotificationType.ERROR,
                title: t`Permit Failed`,
                summary: t`An error occurred while attempting to authorize this token. Instead, please approve normally.`,
              },
              10000,
            )
            mixpanelHandler(MIXPANEL_TYPE.PERMIT_FAILED_TOO_MANY_TIMES, {
              symbol: currency.symbol,
              address: currency.address,
            })
          }
          dispatch(permitError({ chainId, address: currency.address, account }))
        }
      }
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
    notify,
    permitData?.errorCount,
    mixpanelHandler,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
