import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ChargeFeeBy } from 'types/route'

const useGetFeeConfig = () => {
  const [searchParams] = useSearchParams()

  const feeAmount = searchParams.get('feeAmount') || ''
  const chargeFeeBy = (searchParams.get('chargeFeeBy') as ChargeFeeBy) || ChargeFeeBy.NONE
  const enableTip = searchParams.get('enableTip') || ''
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
      }
    return null
  }, [feeAmount, chargeFeeBy, enableTip, isInBps, feeReceiver])

  return feeConfigFromUrl
}

export default useGetFeeConfig
