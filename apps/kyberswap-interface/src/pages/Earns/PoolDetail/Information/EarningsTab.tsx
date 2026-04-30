import { rgba } from 'polished'
import { Box } from 'rebass'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import PoolEarningApr from 'pages/Earns/PoolDetail/components/PoolEarningApr'
import PoolEarningChart from 'pages/Earns/PoolDetail/components/PoolEarningChart'
import PoolEarningReward from 'pages/Earns/PoolDetail/components/PoolEarningReward'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const EarningsTab = () => {
  const theme = useTheme()
  const { chainId, poolAddress } = usePoolDetailContext()

  return (
    <Stack gap={20}>
      <PoolEarningChart chainId={chainId} poolAddress={poolAddress} />

      <Box backgroundColor={rgba(theme.text, 0.06)} height={1} />

      <Stack gap={24}>
        <PoolEarningApr />
        <PoolEarningReward />
      </Stack>
    </Stack>
  )
}

export default EarningsTab
