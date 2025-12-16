import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'react-feather'

import Modal from 'components/Modal'
import {
  BackgroundOverlay,
  CloseButton,
  Description,
  InputLabel,
  InputWrapper,
  ModalContent,
  StyledInput,
  Title,
  TitleWrapper,
  ViewButton,
} from 'components/Recap/styles'
import useRecapData from 'components/Recap/useRecapData'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCloseModal, useModalOpen, useOpenModal, useWalletModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import getShortenAddress from 'utils/getShortenAddress'

const STORAGE_KEY = 'closed2025Recap'

export default function RecapSection() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  useRecapData()

  const isOpen = useModalOpen(ApplicationModal.RECAP)
  const closeRecapModal = useCloseModal(ApplicationModal.RECAP)
  const openRecapModal = useOpenModal(ApplicationModal.RECAP)
  const [nickname, setNickname] = useState('')
  const hasCheckedStorageRef = useRef(false)

  useEffect(() => {
    if (!hasCheckedStorageRef.current) {
      const hasClosedBefore = localStorage.getItem(STORAGE_KEY) === 'true'
      if (!hasClosedBefore && !isOpen) {
        openRecapModal()
      }
      hasCheckedStorageRef.current = true
    }
  }, [isOpen, openRecapModal])

  const handleClose = () => {
    closeRecapModal()
    if (localStorage.getItem(STORAGE_KEY) !== 'true') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  const handleViewJourney = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    // TODO: Implement navigation to journey page
    console.log('View journey with nickname:', nickname || account)
  }

  const defaultAddress = account ? getShortenAddress(account) : ''
  const buttonText = account ? 'View My Journey' : 'Connect wallet'

  return (
    <Modal
      isOpen={isOpen}
      mobileFullWidth
      onDismiss={handleClose}
      maxWidth={480}
      borderRadius="20px"
      bgColor={theme.background}
    >
      <ModalContent>
        <BackgroundOverlay />
        <CloseButton onClick={handleClose}>
          <X color={theme.subText} size={20} />
        </CloseButton>

        <TitleWrapper>
          <Title>
            <Trans>✨ Your 2025 Journey is Ready</Trans>
          </Title>
          <Description>A personalized recap of how you moved the markets this year - via Kyberswap.</Description>
        </TitleWrapper>

        <InputWrapper>
          <InputLabel>Enter Nickname (optional)</InputLabel>
          <StyledInput
            type="text"
            placeholder={defaultAddress}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
        </InputWrapper>

        <ViewButton onClick={handleViewJourney}>
          {buttonText}
          <ArrowRight size={18} />
        </ViewButton>
      </ModalContent>
    </Modal>
  )
}
