import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import ShareModal from 'components/ShareModal'
import { useShareFarmAddressContext } from 'components/YieldPools/ShareFarmAddressContext'
import { FARM_TAB } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'

const ShareFarmAddressModal = () => {
  const { networkInfo } = useActiveWeb3React()
  const { address, setAddress } = useShareFarmAddressContext()

  const [searchParams] = useSearchParams()

  const tab = searchParams.get('tab') || VERSION.ELASTIC
  const type = searchParams.get('type') || FARM_TAB.ACTIVE

  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const shareUrl = address
    ? `${window.location.origin}/farms/${networkInfo.route}?search=${address}&tab=${tab}&type=${type}`
    : ''

  useEffect(() => {
    if (shareUrl) {
      openShareModal()
    }
  }, [openShareModal, shareUrl])

  useEffect(() => {
    setAddress(address => {
      if (!isShareModalOpen) {
        return ''
      }

      return address
    })
  }, [isShareModalOpen, setAddress])

  return <ShareModal title={t`Share with your friends!`} url={shareUrl} />
}

export default ShareFarmAddressModal
