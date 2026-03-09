import { API_URLS } from '@kyber/schema'
import { useEffect, useState } from 'react'

import useDebounce from 'hooks/useDebounce'

type AprData = {
  totalApr: number
  feeApr: number
  egApr: number
  lmApr: number
}

type AprEstimationResponse = {
  data: {
    feeApr: number
    egApr: number
    lmApr: number
  }
}

interface UseEstimatedPositionAprProps {
  chainId: number
  poolAddress: string
  tickLower: number | null
  tickUpper: number | null
  positionLiquidity?: string | number | null
  positionTvl?: string | number | null
  enabled?: boolean
}

const isMissingLiquidity = (value?: string | number | null) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'number') return value <= 0

  const normalizedValue = value.trim()
  return !normalizedValue || Number(normalizedValue) <= 0
}

export default function useEstimatedPositionApr({
  chainId,
  poolAddress,
  tickLower,
  tickUpper,
  positionLiquidity,
  positionTvl,
  enabled = true,
}: UseEstimatedPositionAprProps) {
  const [data, setData] = useState<AprData | null>(null)
  const [loading, setLoading] = useState(false)

  const debouncedLower = useDebounce(tickLower, 150)
  const debouncedUpper = useDebounce(tickUpper, 150)

  useEffect(() => {
    if (
      !enabled ||
      !poolAddress ||
      debouncedLower === null ||
      debouncedUpper === null ||
      isMissingLiquidity(positionLiquidity)
    ) {
      setData(null)
      setLoading(false)
      return
    }

    if (debouncedLower === debouncedUpper) {
      setData(null)
      setLoading(false)
      return
    }

    const normalizedPositionLiquidity = String(positionLiquidity)
    const normalizedPositionTvl = String(positionTvl ?? 0)

    const controller = new AbortController()

    const fetchApr = async () => {
      setLoading(true)

      try {
        const params = new URLSearchParams({
          poolAddress,
          chainId: chainId.toString(),
          tickLower: debouncedLower.toString(),
          tickUpper: debouncedUpper.toString(),
          positionLiquidity: normalizedPositionLiquidity,
          positionTvl: normalizedPositionTvl,
        })

        const response: AprEstimationResponse = await fetch(
          `${API_URLS.ZAP_EARN_API}/v1/apr-estimation?${params.toString()}`,
          { signal: controller.signal },
        ).then(res => res.json())

        setData({
          totalApr: (response.data.feeApr + response.data.egApr + response.data.lmApr) * 100,
          feeApr: response.data.feeApr * 100,
          egApr: response.data.egApr * 100,
          lmApr: response.data.lmApr * 100,
        })
      } catch {
        if (controller.signal.aborted) return
        setData(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchApr()

    return () => controller.abort()
  }, [chainId, debouncedLower, debouncedUpper, enabled, poolAddress, positionLiquidity, positionTvl])

  return { data, loading }
}
