import { t } from '@lingui/macro'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import ShareModal from 'components/ShareModal'
import { FARM_TAB } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useOpenModal } from 'state/application/hooks'
import { useShareFarmAddress } from 'state/farms/classic/hooks'

const ShareFarmAddressModal = () => {
  const { networkInfo } = useActiveWeb3React()
  const [address, setAddress] = useShareFarmAddress()

  const [searchParams] = useSearchParams()

  const tab = searchParams.get('tab') || VERSION.ELASTIC
  const type = searchParams.get('type') || FARM_TAB.ACTIVE

  const openShareModal = useOpenModal(ApplicationModal.SHARE)

  const shareUrl = address
    ? `${window.location.origin}/farms/${networkInfo.route}?search=${address}&tab=${tab}&type=${type}`
    : ''

  useEffect(() => {
    if (shareUrl) {
      openShareModal()
    }
  }, [openShareModal, shareUrl])

  return <ShareModal title={t`Share with your friends!`} url={shareUrl} onDismiss={() => setAddress('')} />
}

export default ShareFarmAddressModal
