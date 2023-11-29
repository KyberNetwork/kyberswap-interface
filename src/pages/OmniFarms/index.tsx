import { useMemo, useState } from 'react'
import { NormalizedFarm, useGetFarmsQuery } from 'services/knprotocol'

import { PageWrapper } from 'components/YieldPools/styleds'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { FarmType } from 'hooks/farms/useFarmFilters'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

import { FarmFilter, FarmList, HarvestModal, SummaryUserFarm } from './components'
import { PageTitle } from './styled'

export default function OmniFarms() {
  const { account } = useActiveWeb3React()
  const { data, isLoading } = useGetFarmsQuery(
    {
      type: FarmType.MyFarm,
      page: 1,
      perPage: 1000,
      account,
      chainNames: MAINNET_NETWORKS.map(item => NETWORKS_INFO[item].aggregatorRoute).join(','),
    },
    {
      skip: !account,
      pollingInterval: 10_000,
    },
  )

  const [showHarvest, setShowHarvest] = useState(false)
  const [farmToHarvest, setDefaultFarmToHarvest] = useState<NormalizedFarm | undefined>(undefined)

  const farmsHasReward = useMemo(
    () =>
      data?.farmPools.filter(farm => {
        return farm.rewardAmounts.some(rw => rw.toExact() !== '0')
      }) || [],
    [data],
  )

  return (
    <PageWrapper>
      <PageTitle>Farms</PageTitle>
      <SummaryUserFarm
        isLoading={isLoading}
        positionTotal={data?.positionTotal}
        onClickHarvest={() => setShowHarvest(true)}
        disabled={!farmsHasReward.length}
      />
      <FarmFilter />
      <FarmList
        onHarvest={(farm: NormalizedFarm) => {
          setShowHarvest(true)
          setDefaultFarmToHarvest(farm)
        }}
      />

      {showHarvest && !!farmsHasReward.length && (
        <HarvestModal
          onDismiss={() => {
            setDefaultFarmToHarvest(undefined)
            setShowHarvest(false)
          }}
          farms={farmsHasReward}
          farmToHarvest={farmToHarvest}
        />
      )}
    </PageWrapper>
  )
}
