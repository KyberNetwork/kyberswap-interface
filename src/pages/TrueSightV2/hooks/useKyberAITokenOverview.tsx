import { useParams } from 'react-router'

import { useIsWhiteListKyberAI } from 'state/user/hooks'

import { useTokenDetailQuery } from './useKyberAIData'

export default function useKyberAITokenOverview() {
  const { isWhiteList } = useIsWhiteListKyberAI()
  const { chain, address } = useParams()
  const result = useTokenDetailQuery({ chain, address }, { skip: !chain || !address || !isWhiteList })

  return result
}
