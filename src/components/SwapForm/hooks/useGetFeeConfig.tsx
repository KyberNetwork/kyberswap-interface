import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MAX_FEE_IN_BIPS } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { ChargeFeeBy } from 'types/route'
import { isAddressString } from 'utils'
import { convertStringToBoolean } from 'utils/string'

const useGetFeeConfig = () => {
  const [searchParams] = useSearchParams()

  let feeAmount = searchParams.get('feeAmount') || ''
  if (feeAmount && +feeAmount > MAX_FEE_IN_BIPS) {
    feeAmount = MAX_FEE_IN_BIPS.toString()
  }

  const clientId = searchParams.get('clientId') || ''
  const chargeFeeByFromParam = (searchParams.get('chargeFeeBy') as ChargeFeeBy) || ChargeFeeBy.NONE
  const preferredFeeTokensParam = searchParams.get('preferredFeeTokens') || ''
  const preferredFeeTokens = preferredFeeTokensParam
    .split(',')
    .filter(item => isAddressString(item))
    .map(item => item.toLowerCase())

  const chainIdFromParam = searchParams.get('chainId')
  const expectedChainId =
    chainIdFromParam && SUPPORTED_NETWORKS.includes(+chainIdFromParam) ? +chainIdFromParam : ChainId.MAINNET
  const native = NativeCurrencies[expectedChainId as ChainId]

  const inputCurrency =
    searchParams.get('inputCurrency')?.toLowerCase() === native.symbol?.toLowerCase()
      ? native.wrapped.address.toLowerCase()
      : searchParams.get('inputCurrency')?.toLowerCase()

  const outputCurrency =
    searchParams.get('outputCurrency')?.toLowerCase() === native.symbol?.toLowerCase()
      ? native.wrapped.address.toLowerCase()
      : searchParams.get('outputCurrency')?.toLowerCase()

  let chargeFeeBy = ChargeFeeBy.NONE

  if (preferredFeeTokens?.includes(inputCurrency)) {
    chargeFeeBy = ChargeFeeBy.CURRENCY_IN
  } else if (preferredFeeTokens?.includes(outputCurrency)) {
    chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
  } else {
    chargeFeeBy = chargeFeeByFromParam
  }

  const enableTip = convertStringToBoolean(searchParams.get('enableTip') || '')
  const isInBps = searchParams.get('isInBps') || ''
  const feeReceiver = searchParams.get('feeReceiver') || ''

  const feeConfigFromUrl = useMemo(() => {
    if (feeAmount && chargeFeeBy && (enableTip || isInBps) && feeReceiver)
      return {
        feeAmount,
        chargeFeeBy,
        enableTip,
        isInBps: enableTip ? '1' : isInBps,
        feeReceiver,
        clientId,
      }
    return null
  }, [feeAmount, chargeFeeBy, enableTip, isInBps, feeReceiver, clientId])

  return feeConfigFromUrl
}

export default useGetFeeConfig
