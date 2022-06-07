import React, { useEffect, useState } from 'react'
import { useModalOpen, useSelectCampaignModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import useTheme from 'hooks/useTheme'
import Modal from 'components/Modal'
import CampaignListAndSearch from 'pages/Campaign/CampaignListAndSearch'
import { X } from 'react-feather'
import { CampaignData, setSelectedCampaign } from 'state/campaigns/actions'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'

export default function ModalSelectCampaign() {
  const isSelectCampaignModalOpen = useModalOpen(ApplicationModal.SELECT_CAMPAIGN)
  const toggleSelectCampaignModal = useSelectCampaignModalToggle()
  const theme = useTheme()

  const dispatch = useAppDispatch()
  const onSelectCampaign = (campaign: CampaignData) => {
    dispatch(setSelectedCampaign({ campaign }))
    setTimeout(() => {
      // UX Improvement
      toggleSelectCampaignModal()
    }, 200)
  }

  return (
    <Modal isOpen={isSelectCampaignModalOpen} onDismiss={toggleSelectCampaignModal}>
      <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
        <X color={theme.subText} size={24} onClick={toggleSelectCampaignModal} />
      </div>
      <CampaignListAndSearch onSelectCampaign={onSelectCampaign} />
    </Modal>
  )
}
