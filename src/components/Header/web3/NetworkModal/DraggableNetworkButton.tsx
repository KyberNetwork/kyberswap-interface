import { ChainId, getChainType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { motion, useAnimationControls, useDragControls } from 'framer-motion'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { MutableRefObject, RefObject, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Minus, Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { ChainState } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const NewLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const MaintainLabel = styled.span`
  font-size: 8px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const ListItem = styled(motion.div)<{ selected?: boolean; $disabled?: boolean; $dragging?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 8px;
  border-radius: 999px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  height: 36px;
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.tableHeader};
  user-select: none;
  cursor: pointer;
  gap: 6px;
  transition: background-color 0.2s ease;
  .drag-button {
    opacity: 0;
    display: none;
  }
  :hover .drag-button {
    opacity: 1;
    display: block;
  }

  ${({ theme, selected }) =>
    selected
      ? css`
          background-color: ${theme.buttonBlack};
          & > div {
            color: ${theme.text};
          }
        `
      : css`
          :hover {
            background-color: ${theme.background};
          }
        `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      cursor: not-allowed;
      color: ${({ theme }) => theme.subText + '72'};
    `}
    
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

const CircleGreen = styled.div`
  height: 16px;
  width: 16px;
  background-color: ${({ theme }) => theme.primary};
  background-clip: content-box;
  border: solid 2px ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 8px;
  margin-left: auto;
`
const WalletWrapper = styled.div`
  height: 18px;
  width: 18px;
  margin-left: auto;
  margin-right: 4px;
  > img {
    height: 18px;
    width: 18px;
  }
`

export default function DraggableNetworkButton({
  droppableRefs,
  networkInfo,
  activeChainIds,
  isSelected,
  disabledMsg,
  isEdittingMobile,
  isAddButton,
  dragConstraints,
  customToggleModal,
  customOnSelectNetwork,
  onChangedNetwork,
  onDrop,
  onFavoriteClick,
}: {
  droppableRefs: MutableRefObject<HTMLDivElement[]>
  networkInfo: NetworkInfo
  activeChainIds?: ChainId[]
  isSelected?: boolean
  disabledMsg?: string
  isEdittingMobile?: boolean
  isAddButton?: boolean
  dragConstraints?: RefObject<Element>
  customToggleModal?: () => void
  customOnSelectNetwork?: (chainId: ChainId) => void
  onChangedNetwork?: () => void
  onDrop?: (dropIndex: string) => void
  onFavoriteClick?: () => void
}) {
  const theme = useTheme()
  const { isWrongNetwork, walletSolana, walletEVM } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const qs = useParsedQueryString()
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const dragControls = useDragControls()
  const animateControls = useAnimationControls()
  const { state, icon, chainId, name } = networkInfo
  const isMaintenance = state === ChainState.MAINTENANCE
  const disabled = (activeChainIds ? !activeChainIds?.includes(chainId) : false) || isMaintenance
  const selected = isSelected && !isWrongNetwork
  const walletKey =
    chainId === ChainId.SOLANA ? walletSolana.walletKey : walletEVM.chainId === chainId ? walletEVM.walletKey : null

  const handleChainSelect = () => {
    if (disabled) return
    customToggleModal?.()
    if (customOnSelectNetwork) {
      customOnSelectNetwork(chainId)
    } else if (getChainType(chainId) === getChainType(chainId)) {
      changeNetwork(chainId, () => {
        const { inputCurrency, outputCurrency, ...rest } = qs
        navigate(
          {
            search: stringify(rest),
          },
          { replace: true },
        )
        onChangedNetwork?.()
      })
    } else {
      changeNetwork(chainId, () => {
        navigate(
          {
            search: '',
          },
          { replace: true },
        )
        onChangedNetwork?.()
      })
    }
  }

  const variants = {
    dragging: {
      boxShadow: '0 5px 10px #00000060',
      filter: 'brightness(0.8)',
      scale: 1.05,
      zIndex: 2,
    },
    normal: {
      boxShadow: '0 0px 0px #00000060',
      filter: 'brightness(1)',
      scale: 1,
      zIndex: [2, 'unset'],
      x: [0, 0],
      y: [0, 0],
    },
  }

  const handleDragStart = () => {
    animateControls.start('dragging')
    setIsDragging(true)
  }
  const handleDragEnd = (e: any) => {
    animateControls.start('normal')

    const eventTarget = e.target as HTMLDivElement

    if (!eventTarget) return

    const droppedElPosition = [
      eventTarget.getBoundingClientRect().left + eventTarget.getBoundingClientRect().width / 2,
      eventTarget.getBoundingClientRect().top + eventTarget.getBoundingClientRect().height / 2,
    ]

    const currentEl: HTMLDivElement | undefined = droppableRefs.current?.find((el: HTMLDivElement) => {
      const { left, top, right, bottom } = el.getBoundingClientRect()
      return (
        left < droppedElPosition[0] &&
        top < droppedElPosition[1] &&
        right > droppedElPosition[0] &&
        bottom > droppedElPosition[1]
      )
    })
    if (currentEl) {
      onDrop?.(currentEl.id)
    }
  }

  return (
    <MouseoverTooltip
      style={{ zIndex: Z_INDEXS.MODAL + 1 }}
      key={networkInfo.chainId}
      text={
        disabled && !isDragging
          ? isMaintenance
            ? t`Chain under maintenance. We will be back as soon as possible.`
            : disabledMsg
          : ''
      }
      width="fit-content"
      placement="top"
    >
      <ListItem
        drag
        dragListener={false}
        dragMomentum={false}
        dragControls={dragControls}
        dragConstraints={dragConstraints}
        dragElastic={0}
        dragTransition={{ bounceStiffness: 500 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onLayoutAnimationStart={() => setIsDragging(true)}
        onLayoutAnimationComplete={() => setIsDragging(false)}
        layoutId={networkInfo.chainId.toString() + networkInfo.route}
        selected={selected}
        animate={animateControls}
        transition={{ type: 'spring', damping: 50, stiffness: 1000 }}
        variants={variants}
        style={{ boxShadow: '0 0px 0px #00000060' }}
        onClick={() => !selected && !isDragging && handleChainSelect()}
        $disabled={disabled}
      >
        <img src={icon} alt="Switch Network" style={{ height: '20px', width: '20px' }} />
        <Row flexGrow={1} gap="6px">
          <Text as="span" textAlign="left">
            {name}
          </Text>
          {state === ChainState.NEW && (
            <NewLabel>
              <Trans>New</Trans>
            </NewLabel>
          )}
          {isMaintenance && (
            <MaintainLabel>
              <Trans>Maintainance</Trans>
            </MaintainLabel>
          )}
          {selected && !walletKey && <CircleGreen />}
          {walletKey && (
            <WalletWrapper>
              <img src={SUPPORTED_WALLETS[walletKey].icon} alt={SUPPORTED_WALLETS[walletKey].name + ' icon'} />
            </WalletWrapper>
          )}
        </Row>
        {isMobile ? (
          isEdittingMobile && (
            <div
              style={{ height: '16px' }}
              onClick={e => {
                e.stopPropagation()
                onFavoriteClick?.()
              }}
            >
              {isAddButton ? <Plus size={16} color={theme.subText} /> : <Minus size={16} color={theme.subText} />}
            </div>
          )
        ) : (
          <div
            className="drag-button"
            style={{ cursor: 'grab' }}
            onPointerDown={e => {
              dragControls.start(e)
              e.stopPropagation()
            }}
            onClick={e => e.stopPropagation()}
          >
            <Icon id="drag-indicator" color={theme.border} />
          </div>
        )}
      </ListItem>
    </MouseoverTooltip>
  )
}
