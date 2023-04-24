import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import FarmIssueAnnouncement from 'components/FarmIssueAnnouncement'
import { APP_PATHS, FARM_TAB } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { useFailedNFTs, useFilteredFarms } from 'state/farms/elastic/hooks'
import { FarmingPool } from 'state/farms/elastic/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { StyledInternalLink } from 'theme'

import { ElasticCompensation } from './ElasticCompensation'
import ElasticFarmGroup from './ElasticFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ElasticFarmModals'
import HarvestModal from './ElasticFarmModals/HarvestModal'
import WithdrawModal from './ElasticFarmModals/WithdrawModal'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest' | 'forcedWithdraw'

const farmIds: { [key: number]: string } = {
  [ChainId.MAINNET]: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
  [ChainId.AVAXMAINNET]: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
  [ChainId.MATIC]: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
  [ChainId.OPTIMISM]: '0xb85ebe2e4ea27526f817ff33fb55fb240057c03f',
  [ChainId.ARBITRUM]: '0xbdec4a045446f583dc564c0a227ffd475b329bf0',
}

function ElasticFarms({ onShowStepGuide }: { onShowStepGuide: () => void }) {
  const theme = useTheme()
  const { networkInfo, chainId } = useActiveWeb3React()

  const [searchParams] = useSearchParams()

  const failedNFTs = useFailedNFTs()

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)

  const type = searchParams.get('type')
  const activeTab: string = type || FARM_TAB.ACTIVE

  const tab = searchParams.get('tab')

  const { filteredFarms, farms, userFarmInfo } = useFilteredFarms()

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

  const renderAnnouncement = () => {
    // show announcement only when user was affected in one of the visible farms on the UI
    const now = Date.now() / 1000

    if (activeTab === 'ended') {
      const endedFarms = farms?.filter(farm => farm.pools.every(p => p.endTime < now))
      const shouldShow = endedFarms?.some(farm =>
        userFarmInfo?.[farm.id].depositedPositions
          .map(pos => pos.nftId.toString())
          .some(nft => failedNFTs.includes(nft)),
      )
      return shouldShow ? <FarmIssueAnnouncement isEnded /> : null
    }

    return null
  }

  const { data: userCompensationData, loading: loadingCompensationData, claimInfo } = useElasticCompensationData()

  const userDepositedInfo = farmIds[chainId] && userFarmInfo?.[farmIds[chainId]]?.depositedPositions
  const canClaimReward = !!userCompensationData?.length && claimInfo
  const canWithdraw = !!userDepositedInfo?.length
  const isActiveTab = !type || type === FARM_TAB.ACTIVE
  const showCompensation = isActiveTab && !loadingCompensationData && (canWithdraw || canClaimReward)

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

      {renderAnnouncement()}

      {type === FARM_TAB.ENDED && tab !== VERSION.CLASSIC && (
        <Text fontStyle="italic" fontSize={12} marginBottom="1rem" color={theme.subText}>
          <Trans>
            Your rewards may be automatically harvested a few days after the farm ends. Please check the{' '}
            <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}?type=vesting`}>Vesting</StyledInternalLink>{' '}
            tab to see your rewards
          </Trans>
        </Text>
      )}

      {(!type || type === FARM_TAB.ACTIVE) && tab !== VERSION.CLASSIC && (
        <Text fontSize={12} color={theme.subText}>
          <Trans>
            Note: Farms will run in{' '}
            <Text as="span" color={theme.warning}>
              multiple phases
            </Text>
            . Once the current phase ends, you can harvest your rewards from the farm in the{' '}
            <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}?type=${FARM_TAB.ENDED}`}>
              Ended
            </StyledInternalLink>{' '}
            tab. To continue earning rewards in the new phase, you must restake your NFT position into the active farm
          </Trans>
        </Text>
      )}

      {showCompensation ? (
        <ElasticCompensation
          onWithdraw={() => {
            setSeletedModal('forcedWithdraw')
            setSeletedFarm(farmIds[chainId])
          }}
          data={userCompensationData}
          numberOfPosition={userDepositedInfo?.length || 0}
          tokenPrices={tokenPrices}
          claimInfo={claimInfo}
        />
      ) : (
        <Flex
          sx={{
            flexDirection: 'column',
            rowGap: '48px',
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
                userInfo={userFarmInfo?.[farm.id]}
                tokenPrices={tokenPrices}
              />
            )
          })}
        </Flex>
      )}
    </>
  )
}

export default ElasticFarms
