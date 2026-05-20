import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import { EIP_2612 } from 'constants/abis'
import { PermitType } from 'constants/permit'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useNotify } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useSingleCallResult } from 'state/multicall/hooks'
import { permitUpdate } from 'state/swap/actions'
import { usePermitData } from 'state/swap/hooks'
import { friendlyError } from 'utils/errorMessage'
import { Address, encodeAbiParameters, parseAbiParameters, parseSignature, parseUnits, toHex } from 'utils/viem'
import { signTypedDataSafe } from 'utils/walletClient'

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
  const { isSmartConnector } = useWeb3React()
  const dispatch = useDispatch()
  const notify = useNotify()
  const eipContract = useReadingContract(currency?.address, EIP_2612)
  const tokenNonceState = useSingleCallResult(eipContract, 'nonces', [account])
  const tokenName = useSingleCallResult(eipContract, 'name')

  const permitData = usePermitData(currency?.address)

  const { trackingHandler } = useTracking()
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
    // Do not allow permit when connected with smart connector
    if (isSmartConnector) {
      return PermitState.NOT_APPLICABLE
    }
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
  }, [permitData, currencyAmount, overwritedPermitData, isSmartConnector])
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
        trackingHandler(TRACKING_EVENT_TYPE.PERMIT_FAILED_TOO_MANY_TIMES, {
          symbol: currency.symbol,
          address: currency.address,
        })
      }
    }
  }, [permitData?.errorCount, notify, trackingHandler, currency, prevErrorCount])
  const signPermitCallback = useCallback(async (): Promise<void> => {
    const nonceResult = tokenNonceState?.result?.[0] as bigint | undefined
    // Check `=== undefined`, not falsy: a first-time permit returns nonce 0n,
    // and `!0n` is true — that would silently abort the callback and freeze
    // the button (no wallet popup, no error). Common when a user signs in
    // with a new wallet/address that has never permitted this token.
    if (!routerAddress || !currency || !account || !overwritedPermitData || nonceResult === undefined) {
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
      // Keep as bigint — Number(BigInt) would silently truncate for nonces > 2^53.
      nonce: nonceResult,
      deadline,
    }

    const typedData = {
      types: {
        // EIP712Domain is omitted on purpose — viem rejects payloads that already
        // include it (signTypedDataSafe also strips it as a defensive measure).
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
              name: tokenName.result?.[0] || currency.name,
              verifyingContract: currency.address,
              salt: toHex(chainId, { size: 32 }),
              version: overwritedPermitData.version,
            }
          : {
              name: tokenName.result?.[0] || currency.name,
              verifyingContract: currency.address,
              version: overwritedPermitData.version,
              chainId,
            },
      primaryType: 'Permit',
      message: message,
    }

    try {
      const rawSignature = await signTypedDataSafe({
        chainId: chainId,
        account: account as Address,
        typedData,
      })
      const signature = parseSignature(rawSignature as `0x${string}`)
      const encodedPermitData = encodeAbiParameters(
        parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'),
        [
          message.owner as `0x${string}`,
          message.spender as `0x${string}`,
          BigInt(message.value),
          BigInt(message.deadline),
          Number(signature.v ?? (signature.yParity === 0 ? 27 : 28)),
          signature.r,
          signature.s,
        ],
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
    currency,
    currencyAmount,
    dispatch,
    notify,
    overwritedPermitData,
    permitState,
    routerAddress,
    tokenName.result,
    tokenNonceState.result,
  ])

  return { permitState, permitCallback: signPermitCallback, permitData }
}
