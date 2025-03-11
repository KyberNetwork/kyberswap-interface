import { splitSignature } from '@ethersproject/bytes'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { defaultAbiCoder, hexZeroPad, hexlify, parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import EIP_2612 from 'constants/abis/eip2612.json'
import { EIP712_DOMAIN_TYPE, EIP712_DOMAIN_TYPE_SALT, PermitType } from 'constants/permit'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useSingleCallResult } from 'state/multicall/hooks'
import { permitUpdate } from 'state/swap/actions'
import { usePermitData } from 'state/swap/hooks'
import { friendlyError } from 'utils/errorMessage'

import { useReadingContract } from './useContract'
import useMixpanel, { MIXPANEL_TYPE } from './useMixpanel'

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
  const eipContract = useReadingContract(currency?.address, EIP_2612)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])

  const permitData = usePermitData(currency?.address)

  const { mixpanelHandler } = useMixpanel()
  const overwritedPermitData = useMemo(
    () =>
      currency instanceof WrappedTokenInfo && ['AMOUNT', 'SALT'].includes(currency.permitType) && currency.permitVersion
        ? {
            type: currency.permitType,
            version: currency.permitVersion,
          }
        : undefined,
    [currency],
  )

  const permitState = useMemo(() => {
    if (!overwritedPermitData) {
      return PermitState.NOT_APPLICABLE
    }
    if (permitData?.errorCount !== undefined && permitData?.errorCount >= 3) return PermitState.NOT_APPLICABLE
    if (
      permitData &&
      permitData.rawSignature &&
      permitData.deadline &&
      permitData.deadline >= Date.now() / 1000 &&
      permitData.value !== undefined &&
      currencyAmount?.equalTo(permitData.value)
    ) {
      return PermitState.SIGNED
    }
    return PermitState.NOT_SIGNED
  }, [permitData, currencyAmount, overwritedPermitData])
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
    if (!library || !routerAddress || !currency || !account || !overwritedPermitData || !tokenNonceState?.result?.[0]) {
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
      deadline,
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
              version: overwritedPermitData.version,
            }
          : {
              name: currency.name,
              verifyingContract: currency.address,
              version: overwritedPermitData.version,
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
    } catch (error) {
      const message = friendlyError(error)
      console.error('Permit error:', { message, error })
      notify(
        {
          title: t`Permit Error`,
          summary: message,
          type: NotificationType.ERROR,
        },
        8000,
      )
    }
  }, [
    account,
    chainId,
    library,
    permitState,
    routerAddress,
    currency,
    currencyAmount,
    dispatch,
    tokenNonceState.result,
    overwritedPermitData,
    notify,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
