import { useParams } from 'react-router'

import { useActiveWeb3React } from 'hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

import { useTokenDetailQuery } from './useKyberAIData'

export default function useKyberAITokenOverview() {
  const { account } = useActiveWeb3React()
  const { isWhiteList } = useIsWhiteListKyberAI()
  const { chain, address } = useParams()
  const result = useTokenDetailQuery({ chain, address, account }, { skip: !chain || !address || !isWhiteList })

  return result
}
