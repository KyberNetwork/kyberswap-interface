import axios from 'axios'

import { AcrossDepositStatusResponse } from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'

const ACROSS_API_BASE_URL = 'https://app.across.to/api'

export const getAcrossDepositStatus = async (depositTxnRef: string): Promise<AcrossDepositStatusResponse> => {
  const { data, status } = await axios.get<AcrossDepositStatusResponse>(`${ACROSS_API_BASE_URL}/deposit/status`, {
    params: { depositTxnRef },
    validateStatus: status => status < 500,
  })

  if (status >= 400 && !data?.error) {
    throw new Error(`Across deposit status failed with HTTP ${status}`)
  }

  return data
}
