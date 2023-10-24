import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Save, X } from 'react-feather'
import { Button, Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'
import styled from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { TYPE } from 'theme'

import DraggableNetworkButton from './DraggableNetworkButton'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`
const gap = isMobile ? '8px' : '16px'

const NetworkList = styled.div`
  min-height: 40px;
  display: flex;
  align-items: center;
  column-gap: ${gap};
  row-gap: 4px;
  flex-wrap: wrap;
  width: 100%;
  & > * {
    width: calc(50% - ${gap} / 2);
  }
`

const FAVORITE_DROPZONE_ID = 'favorite-dropzone'
const CHAINS_DROPZONE_ID = 'chains-dropzone'

const DropzoneOverlay = ({ show, text }: { show: boolean; text: string }) => {
  const theme = useTheme()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: '-6px',
            background: theme.background,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 500,
            borderRadius: '8px',
          }}
          transition={{ duration: 0.1 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function NetworkModal({
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  isOpen,
  customToggleModal,
  disabledMsg,
}: {
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  isOpen?: boolean
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
}): JSX.Element | null {
  const theme = useTheme()
  const { isWrongNetwork } = useActiveWeb3React()
  const [requestSaveProfile] = useUpdateProfileMutation()
  const { userInfo } = useSessionInfo()
  const { mixpanelHandler } = useMixpanel()
  const [dropIdDraggingOver, setDropIdDraggingOver] = useState<string | undefined>()
  const [favoriteChains, setFavoriteChains] = useState<string[]>(userInfo?.data?.favouriteChainIds || [])
  const [isEdittingMobile, setIsEdittingMobile] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const toggleNetworkModal = customToggleModal || toggleNetworkModalGlobal

  const droppableRefs = useRef<HTMLDivElement[]>([])
  const { supportedChains } = useChainsConfig()

  const handleDrag = (chainId: string, dropId?: string) => {
    if (dropId === dropIdDraggingOver) return
    if (dropId === FAVORITE_DROPZONE_ID && !favoriteChains.includes(chainId)) {
      setDropIdDraggingOver(FAVORITE_DROPZONE_ID)
    } else if (dropId === CHAINS_DROPZONE_ID && favoriteChains.includes(chainId)) {
      setDropIdDraggingOver(CHAINS_DROPZONE_ID)
    } else {
      setDropIdDraggingOver(undefined)
    }
  }
  const handleDrop = (chainId: string, dropId: string) => {
    setDropIdDraggingOver(undefined)
    const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
    if (dropId === FAVORITE_DROPZONE_ID) {
      if (chainInfo && !favoriteChains.includes(chainId)) {
        saveFavoriteChains([...favoriteChains, chainId])
        mixpanelHandler(MIXPANEL_TYPE.ADD_FAVORITE_CHAIN, { fav_chain: chainInfo.name })
      }
    }
    if (dropId === CHAINS_DROPZONE_ID && favoriteChains.includes(chainId)) {
      const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
      saveFavoriteChains(favoriteChains.filter(fChainId => fChainId !== chainId))
      chainInfo && mixpanelHandler(MIXPANEL_TYPE.REMOVE_FAVORITE_CHAIN, { remove_chain: chainInfo.name })
    }
  }

  const handleFavoriteChangeMobile = (chainId: string, isAdding: boolean) => {
    const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
    if (isAdding) {
      if (chainInfo && !favoriteChains.includes(chainId)) {
        saveFavoriteChains([...favoriteChains, chainId])
        mixpanelHandler(MIXPANEL_TYPE.ADD_FAVORITE_CHAIN, { fav_chain: chainInfo.name })
      }
    } else {
      if (chainInfo && favoriteChains.includes(chainId)) {
        saveFavoriteChains(favoriteChains.filter(fChainId => fChainId !== chainId))
        mixpanelHandler(MIXPANEL_TYPE.REMOVE_FAVORITE_CHAIN, { remove_chain: chainInfo.name })
      }
    }
  }

  const saveFavoriteChains = (chains: string[]) => {
    const uniqueArray = Array.from(new Set(chains))
    requestSaveProfile({ data: { favouriteChainIds: uniqueArray } })
    setFavoriteChains(uniqueArray)
  }

  const renderNetworkButton = (networkInfo: NetworkInfo, isAdding: boolean) => {
    return (
      <DraggableNetworkButton
        key={networkInfo.chainId}
        droppableRefs={droppableRefs}
        dragConstraints={wrapperRef}
        networkInfo={networkInfo}
        activeChainIds={activeChainIds}
        isSelected={selectedId === networkInfo.chainId}
        disabledMsg={disabledMsg}
        onDrag={(dropId?: string) => {
          handleDrag(networkInfo.chainId.toString(), dropId)
        }}
        onDrop={(dropId: string) => {
          handleDrop(networkInfo.chainId.toString(), dropId)
        }}
        customToggleModal={customToggleModal}
        customOnSelectNetwork={customOnSelectNetwork}
        onChangedNetwork={toggleNetworkModal}
        // Mobile only props
        isAddButton={isAdding}
        isEdittingMobile={isEdittingMobile}
        onFavoriteClick={() => handleFavoriteChangeMobile(networkInfo.chainId.toString(), isAdding)}
      />
    )
  }

  useEffect(() => {
    setFavoriteChains(userInfo?.data?.favouriteChainIds || [])
  }, [userInfo])

  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : networkModalOpen}
      onDismiss={toggleNetworkModal}
      maxWidth={624}
      zindex={Z_INDEXS.MODAL}
      minHeight="500px"
    >
      <Wrapper ref={wrapperRef}>
        <RowBetween>
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </Text>
          <ButtonAction onClick={toggleNetworkModal}>
            <X />
          </ButtonAction>
        </RowBetween>

        <Column marginTop="16px" gap="8px">
          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Favorite Chain(s)</Trans>
            </Text>
            <hr style={{ borderWidth: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
            {isMobile &&
              (isEdittingMobile ? (
                <Button
                  fontSize="12px"
                  backgroundColor={theme.primary + '60'}
                  color={theme.primary}
                  padding="4px 6px"
                  flexShrink={0}
                  style={{ borderRadius: '99px' }}
                  onClick={() => setIsEdittingMobile(false)}
                >
                  <RowFit gap="4px">
                    <Save size={14} />
                    <Trans>Save</Trans>
                  </RowFit>
                </Button>
              ) : (
                <Button
                  fontSize="12px"
                  backgroundColor={theme.border}
                  color={theme.subText}
                  padding="4px 6px"
                  flexShrink={0}
                  style={{ borderRadius: '99px' }}
                  onClick={() => setIsEdittingMobile(true)}
                >
                  <Trans>Edit list</Trans>
                </Button>
              ))}
          </Row>
          <div
            ref={ref => {
              if (ref) {
                droppableRefs.current[0] = ref
              }
            }}
            id={FAVORITE_DROPZONE_ID}
            style={{ position: 'relative', minHeight: '50px' }}
          >
            <DropzoneOverlay show={dropIdDraggingOver === FAVORITE_DROPZONE_ID} text={t`Add to favorite`} />
            {favoriteChains.length === 0 ? (
              <Row border={'1px dashed ' + theme.text + '32'} borderRadius="99px" padding="16px 12px" justify="center">
                <Text fontSize="10px" lineHeight="14px" color={theme.subText}>
                  {isMobile ? (
                    <Trans>Select your favourite chain(s)</Trans>
                  ) : (
                    <Trans>Drag your favourite chain(s) here</Trans>
                  )}
                </Text>
              </Row>
            ) : (
              <NetworkList>
                {supportedChains
                  .filter(chain => favoriteChains.some(i => i === chain.chainId.toString()))
                  .map((networkInfo: NetworkInfo) => {
                    return renderNetworkButton(networkInfo, false)
                  })}
              </NetworkList>
            )}
          </div>

          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Chain List</Trans>
            </Text>
            <hr style={{ borderWidth: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          {isWrongNetwork && (
            <TYPE.main fontSize={16} marginTop={14}>
              <Trans>Please connect to the appropriate chain.</Trans>
            </TYPE.main>
          )}
          <div
            ref={ref => {
              if (ref) {
                droppableRefs.current[1] = ref
              }
            }}
            id={CHAINS_DROPZONE_ID}
            style={{ position: 'relative', minHeight: '50px' }}
          >
            <DropzoneOverlay show={dropIdDraggingOver === CHAINS_DROPZONE_ID} text={t`Remove from favorite`} />
            <NetworkList>
              {supportedChains
                .filter(chain => !favoriteChains.some(i => i === chain.chainId.toString()))
                .map((networkInfo: NetworkInfo) => {
                  return renderNetworkButton(networkInfo, true)
                })}
            </NetworkList>
          </div>
        </Column>
      </Wrapper>
    </Modal>
  )
}
