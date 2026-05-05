import { useParams } from 'react-router-dom'

import AprHistoryChart from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import PoolEarningChart from 'pages/Earns/PoolDetail/components/PoolEarningChart'
import { EarningChartContainer } from 'pages/Earns/PositionDetail/styles'

const EarningsTab = () => {
  const { chainId, positionId } = useParams()

  if (!chainId || !positionId) {
    return null
  }

  return (
    <EarningChartContainer>
      <PoolEarningChart chainId={Number(chainId)} positionId={positionId} />
      <AprHistoryChart chainId={Number(chainId)} positionId={positionId} />
    </EarningChartContainer>
  )
}

export default EarningsTab
