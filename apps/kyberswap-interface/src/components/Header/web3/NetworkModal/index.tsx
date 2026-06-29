import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { LayoutGroup } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useUpdateProfileMutation } from 'services/identity'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import DraggableNetworkButton from 'components/Header/web3/NetworkModal/components/DraggableNetworkButton'
import DropzoneOverlay from 'components/Header/web3/NetworkModal/components/DropzoneOverlay'
import { useDragAndDrop } from 'components/Header/web3/NetworkModal/hooks'
import { NetworkList, Wrapper } from 'components/Header/web3/NetworkModal/styleds'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import SearchInput from 'components/SearchInput'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig, { ChainState } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Chain, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters/types'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useFavoriteChains } from 'state/user/hooks'

const FAVORITE_DROPZONE_ID = 'favorite-dropzone'

const l1Chains = [
  ChainId.MAINNET,
  NonEvmChain.Bitcoin,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  NonEvmChain.Near,
  NonEvmChain.Solana,
  ChainId.BERA,
  ChainId.SONIC,
  ChainId.RONIN,
  ChainId.FANTOM,
  ChainId.HYPEREVM,
  ChainId.PLASMA,
  ChainId.MONAD,
]

const l2Chains = [
  ChainId.BASE,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.UNICHAIN,
  ChainId.LINEA,
  ChainId.ZKSYNC,
  ChainId.SCROLL,
  ChainId.BLAST,
  ChainId.MANTLE,
  ChainId.ETHERLINK,
  ChainId.MEGAETH,
]

export default function NetworkModal({
  deprecatedSoons,
  activeChainIds: activeIds,
  selectedId,
  customOnSelectNetwork,
  isOpen,
  customToggleModal,
  disabledMsg,
}: {
  deprecatedSoons?: Chain[]
  activeChainIds?: Chain[]
  selectedId?: Chain
  isOpen?: boolean
  customOnSelectNetwork?: (chain: Chain) => void
  customToggleModal?: () => void
  disabledMsg?: string
}): React.JSX.Element | null {
  const { isWrongNetwork } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()
  const { trackingHandler } = useTracking()
  const [requestSaveProfile] = useUpdateProfileMutation()
  const [favoriteChains, setFavoriteChains] = useFavoriteChains()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const [searchText, setSearchText] = useState('')
  const modalIsOpen = isOpen !== undefined ? isOpen : networkModalOpen
  const toggleNetworkModal = () => {
    setSearchText('')
    ;(customToggleModal || toggleNetworkModalGlobal)()
  }

  // Reset the search whenever the modal closes — selecting a chain closes via customToggleModal,
  // which bypasses the search reset above, so the next open would otherwise show the stale query.
  useEffect(() => {
    if (!modalIsOpen) setSearchText('')
  }, [modalIsOpen])

  const favoriteDropRef = useRef<HTMLDivElement>(null)
  const { allChains, supportedChains } = useChainsConfig()

  const activeChainIds = activeIds || supportedChains.map(chain => chain.chainId)

  const updateOder = (newOrders: string[], droppedItem: string) => {
    saveFavoriteChains(newOrders, droppedItem)
  }

  const {
    orders: allOrders,
    handleDrag,
    handleDrop,
    draggingItem,
    order,
  } = useDragAndDrop(favoriteChains, favoriteDropRef, updateOder)

  const orders = allOrders.filter(item => activeChainIds.map(i => i.toString()).includes(item))

  const isDraggingAddToFavorite =
    draggingItem !== undefined && !favoriteChains.includes(draggingItem) && order === undefined
  const isDraggingRemoveFavorite = favoriteChains.includes(draggingItem) && order === undefined

  const saveFavoriteChains = (chains: string[], updatedChain: string) => {
    const uniqueArray = Array.from(new Set(chains))
    requestSaveProfile({ data: { favouriteChainIds: uniqueArray } })
    setFavoriteChains(uniqueArray)
    const chainInfo = allChains.find(chain => chain.chainId.toString() === draggingItem)

    if (!chainInfo) return
    if (chains.includes(updatedChain) && !favoriteChains.includes(updatedChain)) {
      trackingHandler(TRACKING_EVENT_TYPE.ADD_FAVORITE_CHAIN, { fav_chain: chainInfo.name })
    }
    if (!chains.includes(updatedChain)) {
      trackingHandler(TRACKING_EVENT_TYPE.REMOVE_FAVORITE_CHAIN, { remove_chain: chainInfo.name })
    }
  }

  const renderNetworkButton = (
    networkInfo: Pick<NetworkInfo, 'state' | 'icon' | 'chainId' | 'name'> & { deprecatedSoon: boolean },
  ) => {
    const chainId = networkInfo.chainId.toString()
    return (
      <DraggableNetworkButton
        key={chainId}
        deprecatedSoon={networkInfo.deprecatedSoon}
        dragConstraints={wrapperRef}
        networkInfo={networkInfo}
        activeChainIds={activeChainIds}
        isSelected={selectedId === networkInfo.chainId}
        disabledMsg={disabledMsg}
        onDrag={(x: number, y: number) => {
          handleDrag(networkInfo.chainId.toString(), x || 0, y || 0)
        }}
        onDrop={handleDrop}
        customToggleModal={customToggleModal}
        customOnSelectNetwork={customOnSelectNetwork}
        onChangedNetwork={toggleNetworkModal}
      />
    )
  }

  const renderListChain = (chains: Chain[], title: string) => {
    const displayChains = chains
      .map(item => {
        if (NonEvmChainInfo[item as NonEvmChain]) {
          return {
            chainId: item,
            name: NonEvmChainInfo[item as NonEvmChain].name,
            icon: NonEvmChainInfo[item as NonEvmChain].icon,
            state: ChainState.ACTIVE,
            deprecatedSoon: deprecatedSoons?.includes(item as Chain) || false,
          }
        }

        const chainInfo = allChains.find(chain => chain.chainId === item)
        return {
          ...chainInfo,
          deprecatedSoon: deprecatedSoons?.includes(item as Chain) || false,
        }
      })
      .filter(Boolean)
      .filter((item: any) => {
        return (
          activeChainIds.includes(item.chainId) &&
          item.name.toLowerCase().includes(searchText.trim().toLowerCase()) &&
          favoriteChains.indexOf(item.chainId.toString()) === -1
        )
      }) as (NetworkInfo & { deprecatedSoon: boolean })[]

    return (
      <>
        <Row className="gap-3">
          <span className="flex-shrink-0 text-[10px] leading-6 text-subText">{title}</span>
          <hr className="w-full border-0 border-b border-solid border-border" />
        </Row>
        <div className="relative mb-3 flex-grow">
          <DropzoneOverlay show={isDraggingRemoveFavorite} text={t`Remove from favorite`} />
          {displayChains.length === 0 ? (
            <Row className="min-h-[60px] justify-center rounded-2xl border border-dashed border-text/20 px-3 py-4">
              <span className="text-[10px] leading-[14px] text-subText">
                <Trans>Drag here to unfavorite chain(s).</Trans>
              </span>
            </Row>
          ) : (
            <NetworkList data-testid="network-list">
              <>{displayChains.map(renderNetworkButton)}</>
            </NetworkList>
          )}
          {isWrongNetwork && (
            <p className="m-0 mt-[14px] text-[16px] font-medium text-subText">
              <Trans>Please connect to the appropriate chain.</Trans>
            </p>
          )}
        </div>
      </>
    )
  }

  useEffect(() => {
    if (userInfo?.data?.favouriteChainIds?.length) setFavoriteChains(userInfo?.data?.favouriteChainIds || [])
  }, [userInfo, setFavoriteChains])
  return (
    <Modal
      isOpen={modalIsOpen}
      onDismiss={toggleNetworkModal}
      zindex={Z_INDEXS.MODAL}
      minHeight="550px"
      maxWidth="800px"
      bgColor="var(--ks-background)"
    >
      <Wrapper ref={wrapperRef}>
        <RowBetween className="items-center">
          <span className="text-xl font-medium">
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </span>
          <div className="flex items-center gap-2">
            <SearchInput
              value={searchText}
              placeholder={t`Search by chain name`}
              onChange={val => {
                setSearchText(val)
              }}
              className="bg-buttonBlack"
            />
            <ButtonAction onClick={toggleNetworkModal}>
              <X />
            </ButtonAction>
          </div>
        </RowBetween>

        <Column className="mt-4 grow gap-2">
          <Row className="gap-3">
            <span className="flex-shrink-0 text-[10px] leading-6 text-subText">
              <Trans>Favorite Chain(s)</Trans>
            </span>
            <hr className="w-full border-0 border-b border-solid border-border" />
          </Row>
          <div ref={favoriteDropRef} id={FAVORITE_DROPZONE_ID} className="relative">
            <DropzoneOverlay show={isDraggingAddToFavorite} text={t`Add to favorite`} />
            {favoriteChains.filter(item => activeChainIds.map(i => i.toString()).includes(item)).length === 0 &&
            !isDraggingAddToFavorite ? (
              <Row className="min-h-[60px] justify-center rounded-2xl border border-dashed border-text/20 px-3 py-4">
                <span className="text-[10px] leading-[14px] text-subText">
                  <Trans>Drag your favourite chain(s) here</Trans>
                </span>
              </Row>
            ) : (
              <NetworkList>
                <LayoutGroup>
                  {orders.map(chainId => {
                    if (chainId === 'ghost') {
                      return <div key="ghost" className="h-[60px] rounded-2xl bg-tableHeader/50" />
                    }
                    const chainInfo = allChains.find(item => item.chainId.toString() === chainId)

                    if (chainInfo && chainInfo.name.toLowerCase().includes(searchText.trim().toLowerCase())) {
                      return renderNetworkButton({
                        ...chainInfo,
                        deprecatedSoon: deprecatedSoons?.includes(chainInfo.chainId) || false,
                      })
                    }

                    if (activeChainIds?.length && !activeChainIds.includes(chainId)) return null

                    const nonEvmChainInfo = NonEvmChainInfo[chainId as NonEvmChain]
                    if (
                      nonEvmChainInfo &&
                      nonEvmChainInfo.name.toLowerCase().includes(searchText.trim().toLowerCase())
                    ) {
                      return renderNetworkButton({
                        chainId: chainId as any,
                        name: NonEvmChainInfo[chainId as NonEvmChain].name,
                        icon: NonEvmChainInfo[chainId as NonEvmChain].icon,
                        state: ChainState.ACTIVE,
                        deprecatedSoon: deprecatedSoons?.includes(chainId as Chain) || false,
                      })
                    }
                    return null
                  })}
                </LayoutGroup>
              </NetworkList>
            )}
          </div>
          {renderListChain(l1Chains, 'Layer-1 Networks')}
          {renderListChain(l2Chains, 'Layer-2 Networks')}
        </Column>
      </Wrapper>
    </Modal>
  )
}
