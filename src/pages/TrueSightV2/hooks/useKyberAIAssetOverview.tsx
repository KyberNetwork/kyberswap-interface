import { useParams } from 'react-router'
import { useSearchParams } from 'react-router-dom'

import { useIsWhiteListKyberAI } from 'state/user/hooks'

import { useAssetOverviewQuery } from './useKyberAIData'

export default function useKyberAIAssetOverview() {
  const { isWhiteList } = useIsWhiteListKyberAI()
  const { assetId } = useParams()

  const [searchParams] = useSearchParams()

  const result = useAssetOverviewQuery({ assetId }, { skip: !assetId || !isWhiteList })

  return {
    data: result.data,
    isLoading: result.isLoading,
    address: searchParams.get('address') || undefined,
    chain: searchParams.get('chain') || undefined,
  }
}
