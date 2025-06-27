import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { LayoutGroup } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import SearchInput from 'components/SearchInput'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig, { ChainState } from 'hooks/useChainsConfig'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { Chain, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useFavoriteChains } from 'state/user/hooks'
import { TYPE } from 'theme'

import DraggableNetworkButton from './components/DraggableNetworkButton'
import DropzoneOverlay from './components/DropzoneOverlay'
import { useDragAndDrop } from './hooks'
import { NetworkList, Wrapper } from './styleds'

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
}): JSX.Element | null {
  const theme = useTheme()
  const { isWrongNetwork } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()
  const { mixpanelHandler } = useMixpanel()
  const [requestSaveProfile] = useUpdateProfileMutation()
  // const [favoriteChains, setFavoriteChains] = useState<string[]>(userInfo?.data?.favouriteChainIds || [])
  const [favoriteChains, setFavoriteChains] = useFavoriteChains()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const [searchText, setSearchText] = useState('')
  const toggleNetworkModal = () => {
    setSearchText('')
    ;(customToggleModal || toggleNetworkModalGlobal)()
  }

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
      mixpanelHandler(MIXPANEL_TYPE.ADD_FAVORITE_CHAIN, { fav_chain: chainInfo.name })
    }
    if (!chains.includes(updatedChain)) {
      mixpanelHandler(MIXPANEL_TYPE.REMOVE_FAVORITE_CHAIN, { remove_chain: chainInfo.name })
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
        <Row gap="12px">
          <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
            {title}
          </Text>
          <hr style={{ borderWidth: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
        </Row>
        <div style={{ position: 'relative', marginBottom: '12px', flexGrow: 1 }}>
          <DropzoneOverlay show={isDraggingRemoveFavorite} text={t`Remove from favorite`} />
          {displayChains.length === 0 ? (
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
            <NetworkList data-testid="network-list">
              <>
                {/*Hardedcode for Ethereum and BTC render first*/}
                {displayChains.map(renderNetworkButton)}
              </>
            </NetworkList>
          )}
          {isWrongNetwork && (
            <TYPE.main fontSize={16} marginTop={14}>
              <Trans>Please connect to the appropriate chain.</Trans>
            </TYPE.main>
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
      isOpen={isOpen !== undefined ? isOpen : networkModalOpen}
      onDismiss={toggleNetworkModal}
      zindex={Z_INDEXS.MODAL}
      minHeight="550px"
      maxWidth="800px"
      bgColor={theme.background}
    >
      <Wrapper ref={wrapperRef}>
        <RowBetween alignItems="center">
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </Text>
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            <SearchInput
              value={searchText}
              placeholder="Search by chain name"
              onChange={val => {
                setSearchText(val)
              }}
              style={{
                backgroundColor: theme.buttonBlack,
              }}
            />
            <ButtonAction onClick={toggleNetworkModal}>
              <X />
            </ButtonAction>
          </Flex>
        </RowBetween>

        <Column marginTop="16px" gap="8px" flexGrow={1}>
          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Favorite Chain(s)</Trans>
            </Text>
            <hr style={{ borderWidth: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          <div ref={favoriteDropRef} id={FAVORITE_DROPZONE_ID} style={{ position: 'relative' }}>
            <DropzoneOverlay show={isDraggingAddToFavorite} text={t`Add to favorite`} />
            {favoriteChains.filter(item => activeChainIds.map(i => i.toString()).includes(item)).length === 0 &&
            !isDraggingAddToFavorite ? (
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
