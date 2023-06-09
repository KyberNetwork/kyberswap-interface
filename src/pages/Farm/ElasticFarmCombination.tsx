import { Trans } from '@lingui/macro'
import { FC, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import ElasticFarms from 'components/YieldPools/ElasticFarms'
import FarmStepGuide from 'components/YieldPools/FarmStepGuide'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useFilteredFarms } from 'state/farms/elastic/hooks'
import { useFilteredFarmsV2 } from 'state/farms/elasticv2/hooks'

import ElasticFarmv2 from './ElasticFarmv2'

export const ElasticFarmCombination: FC = () => {
  const theme = useTheme()
  const { filteredFarms: filteredFarmsV1, loading: loadingV1 } = useFilteredFarms()
  const { filteredFarms: filteredFarmsV2, loading: loadingV2 } = useFilteredFarmsV2()

  // const { networkInfo } = useActiveWeb3React()
  const [searchParams] = useSearchParams()
  const search: string = searchParams.get('search')?.toLowerCase() || ''
  const stakedOnly = searchParams.get('stakedOnly') === 'true'

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
          {stakedOnly || search ? <Trans>No Farms found</Trans> : <Trans>Currently there are no Farms.</Trans>}
        </Text>
      </Flex>
    )
  }

  return (
    <>
      <FarmStepGuide version={showFarmStepGuide} onChangeVersion={setShowFarmStepGuide} />
      <ElasticFarms onShowStepGuide={() => setShowFarmStepGuide('v1')} />
      {!!filteredFarmsV1.length && <div style={{ marginTop: '1rem' }} />}
      <ElasticFarmv2 onShowStepGuide={() => setShowFarmStepGuide('v2')} />
    </>
  )
}
