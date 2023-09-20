import { useState } from 'react'
import { Flex } from 'rebass'

import { useFilteredFarms } from 'state/farms/elastic/hooks'
import { FarmingPool } from 'state/farms/elastic/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

import ElasticFarmGroup from './ElasticFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ElasticFarmModals'
import HarvestModal from './ElasticFarmModals/HarvestModal'
import WithdrawModal from './ElasticFarmModals/WithdrawModal'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest' | 'forcedWithdraw'

function ElasticFarms({ onShowStepGuide }: { onShowStepGuide: () => void }) {
  const { filteredFarms, farms } = useFilteredFarms()

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [selectedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPool, setSeletedPool] = useState<FarmingPool>()
  const pid = selectedPool?.pid
  const selectedPoolId = Number.isNaN(Number(pid)) ? null : Number(pid)

  const tokenAddressList = farms
    ?.map(farm => farm.pools)
    .flat()
    .map(p => [p.token0.wrapped.address, p.token1.wrapped.address, ...p.rewardTokens.map(rw => rw.wrapped.address)])
    .flat()

  const tokenPrices = useTokenPrices([...new Set(tokenAddressList)])

  const onDismiss = () => {
    setSeletedFarm(null)
    setSeletedModal(null)
    setSeletedPool(undefined)
  }

  return (
    <>
      {selectedFarm && selectedModal === 'deposit' && (
        <DepositModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedPoolId !== null && ['stake', 'unstake'].includes(selectedModal || '') && (
        <StakeUnstakeModal
          type={selectedModal as any}
          poolId={selectedPoolId}
          poolAddress={selectedPool?.poolAddress ?? ''}
          selectedFarmAddress={selectedFarm}
          onDismiss={onDismiss}
        />
      )}

      {selectedFarm && selectedModal === 'withdraw' && (
        <WithdrawModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedModal === 'forcedWithdraw' && (
        <WithdrawModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} forced />
      )}

      {selectedFarm && selectedModal === 'harvest' && (
        <HarvestModal farmsAddress={selectedFarm} poolId={selectedPoolId} onDismiss={onDismiss} />
      )}

      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        {filteredFarms.map(farm => {
          return (
            <ElasticFarmGroup
              onShowStepGuide={onShowStepGuide}
              key={farm.id}
              address={farm.id}
              onOpenModal={(modalType: ModalType, pool?: FarmingPool) => {
                setSeletedModal(modalType)
                setSeletedFarm(farm.id)
                setSeletedPool(pool)
              }}
              pools={farm.pools}
              tokenPrices={tokenPrices}
            />
          )
        })}
      </Flex>
    </>
  )
}

export default ElasticFarms
