import { ChainId } from '@dynamic-amm/sdk'
import { t, Trans } from '@lingui/macro'
import { Kyber } from 'components/Icons'
import Modal from 'components/Modal'
import { TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/index'
import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import React from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { ApplicationModal } from 'state/application/actions'
import { useAboutPageModalToggle, useModalOpen } from 'state/application/hooks'

export default function TrueSightNetworkModal(): JSX.Element | null {
  const theme = useTheme()
  const aboutPageModalOpen = useModalOpen(ApplicationModal.ABOUT)
  const toggleAboutPageModal = useAboutPageModalToggle()

  if (!aboutPageModalOpen) return null

  return <Modal isOpen={aboutPageModalOpen} onDismiss={toggleAboutPageModal}></Modal>
}
