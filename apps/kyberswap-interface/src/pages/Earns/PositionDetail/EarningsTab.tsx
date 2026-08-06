import { useParams } from 'react-router-dom'

import AprHistoryChart from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import PoolEarningChart from 'pages/Earns/PoolDetail/components/PoolEarningChart'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import { EarningChartContainer } from 'pages/Earns/PositionDetail/styles'
import { isEgCalculating } from 'pages/Earns/utils/egCalculating'

const EarningsTab = () => {
  const { chainId, positionId } = useParams()
  const { position } = usePositionDetailContext()
  const egCalculating = isEgCalculating(Number(chainId), position?.pool.isFarmingEg)

  if (!chainId || !positionId) {
    return null
  }

  return (
    <EarningChartContainer>
      <PoolEarningChart chainId={Number(chainId)} positionId={positionId} egCalculating={egCalculating} />
      <AprHistoryChart chainId={Number(chainId)} positionId={positionId} egCalculating={egCalculating} />
    </EarningChartContainer>
  )
}

export default EarningsTab
