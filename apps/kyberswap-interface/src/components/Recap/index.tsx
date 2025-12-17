import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'react-feather'

import Modal from 'components/Modal'
import RecapJourney from 'components/Recap/RecapJourney'
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
const NICKNAME_STORAGE_KEY = 'recapNickname'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default function RecapSection() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const { data } = useRecapData()

  const isOpen = useModalOpen(ApplicationModal.RECAP)
  const closeRecapModal = useCloseModal(ApplicationModal.RECAP)
  const openRecapModal = useOpenModal(ApplicationModal.RECAP)
  const [nickname, setNickname] = useState('')
  const [showJourney, setShowJourney] = useState(false)
  const hasCheckedStorageRef = useRef(false)
  const hasLoadedNicknameRef = useRef(false)

  useEffect(() => {
    if (!hasCheckedStorageRef.current) {
      const forceOpen = localStorage.getItem('forceOpenRecap') === 'true'
      if (forceOpen) {
        localStorage.removeItem('forceOpenRecap')
        if (!isOpen) {
          openRecapModal()
        }
      } else {
        const hasClosedBefore = localStorage.getItem(STORAGE_KEY) === 'true'
        if (!hasClosedBefore && !isOpen) {
          openRecapModal()
        }
      }
      hasCheckedStorageRef.current = true
    }
  }, [isOpen, openRecapModal])

  // Load nickname from localStorage with expiry
  useEffect(() => {
    if (hasLoadedNicknameRef.current) return
    const raw = localStorage.getItem(NICKNAME_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { value?: string; expiresAt?: number }
        if (parsed?.value && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
          setNickname(parsed.value)
        } else {
          localStorage.removeItem(NICKNAME_STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(NICKNAME_STORAGE_KEY)
      }
    }
    hasLoadedNicknameRef.current = true
  }, [])

  // Persist nickname with 30-day expiry
  useEffect(() => {
    if (!hasLoadedNicknameRef.current) return
    if (nickname) {
      const payload = {
        value: nickname,
        expiresAt: Date.now() + THIRTY_DAYS_MS,
      }
      localStorage.setItem(NICKNAME_STORAGE_KEY, JSON.stringify(payload))
    } else {
      localStorage.removeItem(NICKNAME_STORAGE_KEY)
    }
  }, [nickname])

  // Reset journey when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowJourney(false)
    }
  }, [isOpen])

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
    setShowJourney(true)
  }

  const defaultAddress = account ? getShortenAddress(account) : ''
  const buttonText = account ? 'View My Journey' : 'Connect wallet'

  return (
    <Modal
      isOpen={isOpen}
      mobileFullWidth
      onDismiss={handleClose}
      maxWidth={showJourney ? 640 : 480}
      maxHeight={showJourney ? 640 : undefined}
      width={showJourney ? '640px' : undefined}
      height={showJourney ? '640px' : undefined}
      borderRadius={showJourney ? '8px' : '20px'}
    >
      {showJourney ? (
        <RecapJourney
          nickname={nickname || defaultAddress}
          totalVolume={data?.totalVolume || 0}
          totalUsers={data?.totalUsers || 0}
          tradingVolume={data?.tradingVolume || 0}
          txCount={data?.txCount || 0}
          top={data?.top || 20}
          topChains={data?.topChains || []}
          topTokens={data?.topTokens || []}
          totalRewards={data?.totalRewards || 0}
          onClose={handleClose}
        />
      ) : (
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
      )}
    </Modal>
  )
}
