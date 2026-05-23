import { Stack } from 'components/Stack'
import PoolEarningApr from 'pages/Earns/PoolDetail/components/PoolEarningApr'
import PoolEarningChart from 'pages/Earns/PoolDetail/components/PoolEarningChart'
import PoolEarningReward from 'pages/Earns/PoolDetail/components/PoolEarningReward'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const EarningsTab = () => {
  const { chainId, poolAddress } = usePoolDetailContext()

  return (
    <Stack gap={20}>
      <PoolEarningChart chainId={chainId} poolAddress={poolAddress} />

      <div className="h-px bg-text/[0.06]" />

      <Stack gap={24}>
        <PoolEarningApr />
        <PoolEarningReward />
      </Stack>
    </Stack>
  )
}

export default EarningsTab
