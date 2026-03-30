import { Stack } from 'components/Stack'
import PoolEarningsChart from 'pages/Earns/PoolDetail/components/PoolEarningsChart'
import PoolEarningsInsights from 'pages/Earns/PoolDetail/components/PoolEarningsInsights'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const EarningsTab = () => {
  const { chainId, chainInfo, pool, poolAddress } = usePoolDetailContext()

  return (
    <Stack gap={20}>
      <PoolEarningsChart chainId={chainId} poolAddress={poolAddress} />

      <PoolEarningsInsights chainId={chainId} chainInfo={chainInfo} pool={pool} poolAddress={poolAddress} />
    </Stack>
  )
}

export default EarningsTab
