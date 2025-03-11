import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { motion, useAnimationControls, useDragControls } from 'framer-motion'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { RefObject, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React, useWeb3React } from 'hooks'
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
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  height: 60px;
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.background};
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
    selected &&
    css`
      background-color: ${theme.buttonBlack};
      & > div {
        color: ${theme.text};
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
    height: 54px;
    padding: 8px;
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

const DraggableNetworkButton = ({
  networkInfo,
  activeChainIds,
  isSelected,
  disabledMsg,
  dragConstraints,
  customToggleModal,
  customOnSelectNetwork,
  onChangedNetwork,
  onDrag,
  onDrop,
  isComingSoon,
}: {
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
  onDrag?: (x: number, y: number) => void
  onDrop?: () => void
  onFavoriteClick?: () => void
  isComingSoon?: boolean
}) => {
  const theme = useTheme()
  const { isWrongNetwork, walletKey: walletName, chainId: walletChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { connector, account } = useWeb3React()
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const animationControls = useAnimationControls()
  const qs = useParsedQueryString()
  const navigate = useNavigate()
  const { state, icon, chainId, name } = networkInfo
  const isMaintenance = state === ChainState.MAINTENANCE
  const disabled = isComingSoon || (activeChainIds ? !activeChainIds?.includes(chainId) : false) || isMaintenance
  const selected = isSelected && !isWrongNetwork
  const walletKey = walletChainId === chainId ? walletName : null

  const handleChainSelect = () => {
    if (disabled) return
    customToggleModal?.()
    if (customOnSelectNetwork) {
      customOnSelectNetwork(chainId)
    } else {
      changeNetwork(chainId, () => {
        navigate(
          {
            search: stringify(qs),
          },
          { replace: true },
        )
        onChangedNetwork?.()
      })
    }
  }

  const variants = {
    dragging: {
      zIndex: 100,
    },
    longpress: {
      x: [-10, 10, -10, 10, -10, 10, -10, 10, -10, 10, 0],
      transition: { duration: 2 },
    },
    normal: {
      x: 0,
      y: 0,
      zIndex: 1,
      transition: { zIndex: { delay: 0.5 } },
    },
  }

  const handleDragStart = () => {
    setDragging(true)
  }

  const handleDrag = () => {
    if (!ref.current) return
    const { x, y, width, height } = ref.current.getBoundingClientRect()
    const centerX = x + width / 2
    const centerY = y + height / 2
    onDrag?.(centerX, centerY)
  }

  const handleDragEnd = (e: any) => {
    e.stopPropagation()
    setDragging(false)
    onDrop?.()
  }
  useEffect(() => {
    animationControls.start(dragging ? 'dragging' : 'normal')
  }, [dragging, animationControls])

  return (
    <MouseoverTooltip
      style={{ zIndex: Z_INDEXS.MODAL + 1 }}
      key={networkInfo.chainId}
      text={
        disabled && !dragging
          ? isMaintenance
            ? t`Chain under maintenance. We will be back as soon as possible.`
            : disabledMsg
          : ''
      }
      width="fit-content"
      placement="top"
    >
      <motion.div
        animate={dragging ? 'dragging' : 'normal'}
        variants={variants}
        style={{ position: 'relative', width: '100%', zIndex: 1 }}
      >
        {dragging && (
          <div
            key="ghost"
            style={{
              width: '100%',
              inset: '0',
              backgroundColor: theme.tableHeader + '80',
              borderRadius: '16px',
              position: 'absolute',
            }}
          />
        )}
        <ListItem
          ref={ref}
          key={networkInfo.chainId.toString()}
          drag
          layoutId={networkInfo.chainId.toString()}
          dragMomentum={false}
          dragControls={dragControls}
          dragConstraints={dragConstraints}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          selected={selected}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 150,
          }}
          whileDrag={{
            backgroundColor: theme.tableHeader,
            boxShadow: '0 5px 15px #00000060',
            border: '1px solid ' + theme.primary,
            scale: 1.05,
          }}
          whileHover={{
            backgroundColor: theme.tableHeader,
          }}
          animate={animationControls}
          variants={variants}
          style={{ boxShadow: '0 0px 0px #00000060', zIndex: 1 }}
          onClick={() => !selected && !dragging && handleChainSelect()}
          onMouseUp={e => e.preventDefault()}
          $disabled={disabled}
        >
          <img src={icon} alt="Switch Network" style={{ height: '20px', width: '20px' }} />
          <Row flexGrow={1} gap="6px">
            <Text as="span" textAlign="left">
              {name}
            </Text>
            {isComingSoon && (
              <MaintainLabel>
                <Trans>Coming Soon</Trans>
              </MaintainLabel>
            )}
            {state === ChainState.NEW && (
              <NewLabel>
                <Trans>New</Trans>
              </NewLabel>
            )}
            {isMaintenance && (
              <MaintainLabel>
                <Trans>Maintenance</Trans>
              </MaintainLabel>
            )}
            {selected && !walletKey && <CircleGreen />}
            {account && walletKey && connector?.icon && (
              <WalletWrapper>
                <img src={connector.icon} alt="" />
              </WalletWrapper>
            )}
          </Row>
          {!isMobile && (
            <div className="drag-button" style={{ cursor: 'grab' }}>
              <Icon id="drag-indicator" color={theme.border} />
            </div>
          )}
        </ListItem>
      </motion.div>
    </MouseoverTooltip>
  )
}

export default DraggableNetworkButton
