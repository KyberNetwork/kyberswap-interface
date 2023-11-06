import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { LayoutGroup } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { TYPE } from 'theme'

import { DropzoneOverlay } from './components'
import DraggableNetworkButton from './components/DraggableNetworkButton'
import { useDragAndDrop } from './hooks'
import { NetworkList, Wrapper } from './styleds'

const FAVORITE_DROPZONE_ID = 'favorite-dropzone'

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
  const [favoriteChains, setFavoriteChains] = useState<string[]>(userInfo?.data?.favouriteChainIds || [])

  const wrapperRef = useRef<HTMLDivElement>(null)

  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const toggleNetworkModal = customToggleModal || toggleNetworkModalGlobal

  const favoriteDropRef = useRef<HTMLDivElement>(null)
  const { supportedChains } = useChainsConfig()

  const updateOder = (newOrders: string[]) => {
    saveFavoriteChains(newOrders)
  }

  const { handleDrag, orders, handleDrop, draggingItem, order } = useDragAndDrop(
    favoriteChains,
    favoriteDropRef,
    updateOder,
  )
  const isDraggingOver = draggingItem !== undefined && !favoriteChains.includes(draggingItem) && order === undefined
  const isDraggingOver2 = favoriteChains.includes(draggingItem) && order === undefined

  // todo: add mixpanel events
  // const handleFavoriteChangeMobile = (chainId: string, isAdding: boolean) => {
  //   const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
  //   if (isAdding) {
  //     if (chainInfo && !favoriteChains.includes(chainId)) {
  //       saveFavoriteChains([...favoriteChains, chainId])
  //       mixpanelHandler(MIXPANEL_TYPE.ADD_FAVORITE_CHAIN, { fav_chain: chainInfo.name })
  //     }
  //   } else {
  //     if (chainInfo && favoriteChains.includes(chainId)) {
  //       saveFavoriteChains(favoriteChains.filter(fChainId => fChainId !== chainId))
  //       mixpanelHandler(MIXPANEL_TYPE.REMOVE_FAVORITE_CHAIN, { remove_chain: chainInfo.name })
  //     }
  //   }
  // }

  const saveFavoriteChains = (chains: string[]) => {
    const uniqueArray = Array.from(new Set(chains))
    requestSaveProfile({ data: { favouriteChainIds: uniqueArray } })
    setFavoriteChains(uniqueArray)
  }

  const renderNetworkButton = (networkInfo: NetworkInfo) => {
    const chainId = networkInfo.chainId.toString()
    return (
      <DraggableNetworkButton
        key={chainId}
        dragConstraints={wrapperRef}
        networkInfo={networkInfo}
        activeChainIds={activeChainIds}
        isSelected={selectedId === networkInfo.chainId}
        disabledMsg={disabledMsg}
        onDrag={(x: number, y: number) => {
          handleDrag(networkInfo.chainId.toString(), x || 0, y || 0)
        }}
        onDrop={() => {
          if (isDraggingOver2) {
            setFavoriteChains([...favoriteChains.filter(_ => _ !== chainId)])
          }
          handleDrop()
        }}
        customToggleModal={customToggleModal}
        customOnSelectNetwork={customOnSelectNetwork}
        onChangedNetwork={toggleNetworkModal}
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
      zindex={Z_INDEXS.MODAL}
      minHeight="550px"
      maxWidth="800px"
      bgColor={theme.background}
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
          </Row>
          <div ref={favoriteDropRef} id={FAVORITE_DROPZONE_ID} style={{ position: 'relative' }}>
            <DropzoneOverlay show={isDraggingOver} text={t`Add to favorite`} />
            {favoriteChains.length === 0 && !isDraggingOver ? (
              <Row
                border={'1px dashed ' + theme.text + '32'}
                borderRadius="16px"
                padding="16px 12px"
                justify="center"
                minHeight="60px"
              >
                <Text fontSize="10px" lineHeight="14px" color={theme.subText}>
                  <Trans>Drag your favourite chain(s) here</Trans>
                </Text>
              </Row>
            ) : (
              <NetworkList>
                <LayoutGroup>
                  {orders.map(chainId => {
                    if (chainId === 'ghost') {
                      return (
                        <div
                          key="ghost"
                          style={{ height: '60px', backgroundColor: theme.tableHeader + '80', borderRadius: '16px' }}
                        />
                      )
                    }
                    const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
                    if (chainInfo) {
                      return renderNetworkButton(chainInfo)
                    }
                    return null
                  })}
                </LayoutGroup>
              </NetworkList>
            )}
          </div>

          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Chain List</Trans>
            </Text>
            <hr style={{ borderWidth: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <DropzoneOverlay show={isDraggingOver2} text={t`Remove from favorite`} />
            {supportedChains.filter(chain => !favoriteChains.some(_ => _ === chain.chainId.toString())).length === 0 ? (
              <Row
                border={'1px dashed ' + theme.text + '32'}
                borderRadius="16px"
                padding="16px 12px"
                justify="center"
                minHeight="60px"
              >
                <Text fontSize="10px" lineHeight="14px" color={theme.subText}>
                  <Trans>Drag here to unfavorite chain(s).</Trans>
                </Text>
              </Row>
            ) : (
              <NetworkList>
                {supportedChains
                  .filter(chain => !favoriteChains.some(_ => _ === chain.chainId.toString()))
                  .map((networkInfo: NetworkInfo) => {
                    return renderNetworkButton(networkInfo)
                  })}
              </NetworkList>
            )}
            {isWrongNetwork && (
              <TYPE.main fontSize={16} marginTop={14}>
                <Trans>Please connect to the appropriate chain.</Trans>
              </TYPE.main>
            )}
          </div>
        </Column>
      </Wrapper>
    </Modal>
  )
}
