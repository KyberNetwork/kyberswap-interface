import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'react-feather'
import { useMedia } from 'react-use'

import { ModalCenter } from 'components/Modal'
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
import { isAutoOpenAvailable, isRecapAvailable } from 'components/Recap/utils'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCloseModal, useModalOpen, useOpenModal, useWalletModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import getShortenAddress from 'utils/getShortenAddress'

const STORAGE_KEY = 'closed2025Recap'
const NICKNAME_STORAGE_KEY = 'recapNickname'

export default function RecapSection() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const upTo640 = useMedia('(max-width: 640px)')
  const upTo480 = useMedia('(max-width: 480px)')

  const { data } = useRecapData()

  const isOpen = useModalOpen(ApplicationModal.RECAP)
  const closeRecapModal = useCloseModal(ApplicationModal.RECAP)
  const openRecapModal = useOpenModal(ApplicationModal.RECAP)
  const [nickname, setNickname] = useState('')
  const [showJourney, setShowJourney] = useState(false)
  const hasCheckedStorageRef = useRef(false)
  const hasLoadedNicknameRef = useRef(false)
  const wasOpenBeforeWalletConnectRef = useRef(false)

  useEffect(() => {
    if (!hasCheckedStorageRef.current) {
      if (!isAutoOpenAvailable()) {
        hasCheckedStorageRef.current = true
        return
      }

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

  useEffect(() => {
    if (hasLoadedNicknameRef.current) return
    const saved = localStorage.getItem(NICKNAME_STORAGE_KEY)
    if (saved) {
      setNickname(saved)
    }
    hasLoadedNicknameRef.current = true
  }, [])

  // Persist nickname
  useEffect(() => {
    if (!hasLoadedNicknameRef.current) return
    if (nickname) {
      localStorage.setItem(NICKNAME_STORAGE_KEY, nickname)
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

  // Track if modal was open before wallet connect, and re-open if it was closed
  useEffect(() => {
    if (isOpen) {
      wasOpenBeforeWalletConnectRef.current = true
    }
  }, [isOpen])

  // Re-open modal if it was closed after wallet connect
  useEffect(() => {
    if (account && wasOpenBeforeWalletConnectRef.current && !isOpen && !showJourney) {
      // Small delay to ensure wallet modal is fully closed
      const timer = setTimeout(() => {
        openRecapModal()
        wasOpenBeforeWalletConnectRef.current = false
      }, 200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [account, isOpen, showJourney, openRecapModal])

  const handleClose = () => {
    wasOpenBeforeWalletConnectRef.current = false
    closeRecapModal()
    if (localStorage.getItem(STORAGE_KEY) !== 'true') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  const handleViewJourney = () => {
    if (!account) {
      wasOpenBeforeWalletConnectRef.current = true
      toggleWalletModal()
      return
    }
    setShowJourney(true)
  }

  if (!isRecapAvailable() && !isOpen) {
    return null
  }

  const defaultAddress = account ? getShortenAddress(account) : ''
  const buttonText = account ? 'View My Journey' : 'Connect wallet'

  const getModalSize = () => {
    if (!showJourney) {
      if (upTo480) {
        return {
          maxWidth: '80vw',
          maxHeight: undefined,
          width: '80vw',
          height: undefined,
        }
      }
      return {
        maxWidth: 480,
        maxHeight: undefined,
        width: undefined,
        height: undefined,
      }
    }

    if (upTo480) {
      return {
        maxWidth: '100vw',
        maxHeight: '100vw',
        width: '100vw',
        height: '100vw',
      }
    } else if (upTo640) {
      return {
        maxWidth: 480,
        maxHeight: 480,
        width: '480px',
        height: '480px',
      }
    } else {
      return {
        maxWidth: 640,
        maxHeight: 640,
        width: '640px',
        height: '640px',
      }
    }
  }

  const modalSize = getModalSize()

  return (
    <ModalCenter
      isOpen={isOpen}
      mobileFullWidth
      onDismiss={handleClose}
      maxWidth={modalSize.maxWidth}
      maxHeight={modalSize.maxHeight}
      width={modalSize.width}
      height={modalSize.height}
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
              placeholder={defaultAddress || 'Enter your nickname'}
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
    </ModalCenter>
  )
}
