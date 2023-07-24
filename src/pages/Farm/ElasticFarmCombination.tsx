import { Trans } from '@lingui/macro'
import { FC, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import ElasticFarms from 'components/YieldPools/ElasticFarms'
import FarmStepGuide from 'components/YieldPools/FarmStepGuide'
import { APP_PATHS, FARM_TAB } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useFilteredFarms } from 'state/farms/elastic/hooks'
import { useFilteredFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { StyledInternalLink } from 'theme'

import ElasticFarmv2 from './ElasticFarmv2'

export const ElasticFarmCombination: FC = () => {
  const theme = useTheme()
  const { networkInfo } = useActiveWeb3React()
  const { filteredFarms: filteredFarmsV1, loading: loadingV1 } = useFilteredFarms()
  const { filteredFarms: filteredFarmsV2, loading: loadingV2 } = useFilteredFarmsV2()

  const farmByContract = useMemo(() => {
    return filteredFarmsV2?.reduce((acc, cur) => {
      if (acc[cur.farmAddress]) {
        acc[cur.farmAddress].push(cur)
      } else {
        acc[cur.farmAddress] = [cur]
      }

      return acc
    }, {} as { [address: string]: ElasticFarmV2[] })
  }, [filteredFarmsV2])

  const [searchParams] = useSearchParams()
  const search: string = searchParams.get('search')?.toLowerCase() || ''
  const type = searchParams.get('type')
  const tab = searchParams.get('tab')

  const noFarms = !filteredFarmsV1.length && !filteredFarmsV2.length
  const loading = loadingV1 || loadingV2

  const [showFarmStepGuide, setShowFarmStepGuide] = useState<'v1' | 'v2' | null>(null)
  const [sharePoolAddress, setSharePoolAddress] = useState('')
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  useEffect(() => {
    if (sharePoolAddress) {
      openShareModal()
    }
  }, [openShareModal, sharePoolAddress])

  useEffect(() => {
    setSharePoolAddress(addr => {
      if (!isShareModalOpen) {
        return ''
      }

      return addr
    })
  }, [isShareModalOpen])

  if (loading && noFarms) {
    return (
      <Flex
        sx={{
          borderRadius: '16px',
        }}
        backgroundColor={theme.background}
      >
        <LocalLoader />
      </Flex>
    )
  }

  if (noFarms) {
    return (
      <Flex backgroundColor={theme.background} justifyContent="center" padding="32px" sx={{ borderRadius: '20px' }}>
        <Text color={theme.subText}>
          {search ? <Trans>No Farms found</Trans> : <Trans>Currently there are no Farms.</Trans>}
        </Text>
      </Flex>
    )
  }

  return (
    <>
      <FarmStepGuide version={showFarmStepGuide} onChangeVersion={setShowFarmStepGuide} />

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
        <Text fontSize={12} color={theme.subText} marginBottom="1.5rem">
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

      <Flex
        flexDirection="column"
        sx={{ border: `1px solid ${theme.border}`, borderRadius: '24px', overflow: 'hidden' }}
      >
        <ElasticFarms onShowStepGuide={() => setShowFarmStepGuide('v1')} />

        {!!filteredFarmsV1.length && !!filteredFarmsV2.length && <Divider />}

        {Object.keys(farmByContract).map((contract, index) => (
          <>
            <ElasticFarmv2 onShowStepGuide={() => setShowFarmStepGuide('v2')} farmAddress={contract} key={contract} />
            {index !== Object.keys(farmByContract).length - 1 && <Divider />}
          </>
        ))}
      </Flex>
    </>
  )
}
