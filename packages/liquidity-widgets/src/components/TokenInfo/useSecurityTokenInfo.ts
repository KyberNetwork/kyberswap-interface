import { useEffect, useMemo, useState } from 'react'

import { API_URLS } from '@kyber/schema'

import { SecurityInfo, getSecurityTokenInfo } from '@/components/TokenInfo/utils'
import { useWidgetContext } from '@/stores'

export default function useSecurityTokenInfo(tokenAddress: string) {
  const chainId = useWidgetContext(s => s.chainId)
  const [securityRawInfo, setSecurityRawInfo] = useState<SecurityInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const parsedSecurityInfo = useMemo(() => getSecurityTokenInfo(securityRawInfo), [securityRawInfo])

  const handleFetchSecurityData = () => {
    setLoading(true)
    fetch(`${API_URLS.GO_PLUS_API}/${chainId}?contract_addresses=${tokenAddress}`)
      .then(res => res.json())
      .then(data => setSecurityRawInfo(data.result?.[tokenAddress]))
      .catch(e => {
        console.log(e.message)
        setSecurityRawInfo(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!tokenAddress) return
    handleFetchSecurityData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, tokenAddress])

  return { securityInfo: parsedSecurityInfo, loading }
}
