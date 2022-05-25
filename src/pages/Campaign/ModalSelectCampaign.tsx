import React from 'react'
import { useModalOpen, useSelectCampaignModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import useTheme from 'hooks/useTheme'
import Modal from 'components/Modal'
import CampaignListAndSearch from 'pages/Campaign/CampaignListAndSearch'
import { X } from 'react-feather'

export default function ModalSelectCampaign() {
  const isSelectCampaignModalOpen = useModalOpen(ApplicationModal.SELECT_CAMPAIGN)
  const toggleSelectCampaignModal = useSelectCampaignModalToggle()
  const theme = useTheme()

  return (
    <Modal isOpen={isSelectCampaignModalOpen} onDismiss={toggleSelectCampaignModal}>
      <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
        <X color={theme.subText} size={24} onClick={toggleSelectCampaignModal} />
      </div>
      <CampaignListAndSearch onSelectCampaign={toggleSelectCampaignModal} />
    </Modal>
  )
}
