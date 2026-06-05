import { Trans, t } from '@lingui/macro'
import { motion, useAnimationControls, useDragControls } from 'framer-motion'
import { RefObject, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ChainState } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Chain, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { cn } from 'utils/cn'

const NewLabel = ({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) => (
  <span style={style} className={cn('-mt-2.5 ml-0.5 text-xs text-red', className)}>
    {children}
  </span>
)

const MaintainLabel = ({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) => (
  <span style={style} className={cn('-mt-2.5 ml-0.5 text-[8px] text-red', className)}>
    {children}
  </span>
)

const CircleGreen = () => (
  <div className="ml-auto size-4 rounded-lg border-2 border-primary/30 bg-primary bg-clip-content" />
)

const DraggableNetworkButton = ({
  networkInfo,
  activeChainIds,
  deprecatedSoon,
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
  deprecatedSoon: boolean
  networkInfo: Pick<NetworkInfo, 'state' | 'icon' | 'chainId' | 'name'>
  activeChainIds?: Chain[]
  isSelected?: boolean
  disabledMsg?: string
  isEdittingMobile?: boolean
  isAddButton?: boolean
  dragConstraints?: RefObject<Element>
  customToggleModal?: () => void
  customOnSelectNetwork?: (chainId: Chain) => void
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
  const [searchParams, setSearchParams] = useSearchParams()
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
    } else if (Object.values(NonEvmChain).includes(chainId)) {
      if (window.location.pathname !== APP_PATHS.CROSS_CHAIN)
        navigate(`${APP_PATHS.CROSS_CHAIN}?from=${chainId}&showConnect=true`)
      else {
        const to = searchParams.get('to')
        if (chainId !== to) {
          searchParams.set('from', chainId)
          searchParams.set('showConnect', 'true')
        }
        setSearchParams(searchParams, { replace: true })
      }
      onChangedNetwork?.()
      return
    } else {
      const filteredParams = Object.fromEntries(Object.entries(qs).filter(([_, value]) => value !== undefined)) as {
        [key: string]: string
      }

      changeNetwork(chainId, () => {
        const nextSearch = new URLSearchParams(filteredParams).toString()

        if (nextSearch !== window.location.search.replace(/^\?/, '')) {
          navigate(
            {
              search: nextSearch,
            },
            { replace: true },
          )
        }
        onChangedNetwork?.()
      })
    }
  }

  const variants = {
    dragging: { zIndex: 100 },
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

  const handleDragStart = () => setDragging(true)
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
      key={chainId}
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
        {dragging && <div key="ghost" className="absolute inset-0 w-full rounded-2xl bg-tableHeader/50" />}
        <motion.div
          ref={ref}
          key={chainId.toString()}
          drag
          layoutId={chainId.toString()}
          dragMomentum={false}
          dragControls={dragControls}
          dragConstraints={dragConstraints}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          whileDrag={{
            backgroundColor: theme.tableHeader,
            boxShadow: '0 5px 15px #00000060',
            border: '1px solid ' + theme.primary,
            scale: 1.05,
          }}
          whileHover={selected ? undefined : { backgroundColor: theme.tableHeader }}
          animate={animationControls}
          variants={variants}
          style={{ boxShadow: '0 0px 0px #00000060', zIndex: 1 }}
          onClick={() => !selected && !dragging && handleChainSelect()}
          onMouseUp={e => e.preventDefault()}
          className={cn(
            'group flex h-[60px] w-full cursor-pointer select-none items-center justify-center gap-1.5',
            'overflow-hidden whitespace-nowrap rounded-2xl bg-background p-3 text-sm text-subText',
            'transition-[background-color] duration-200 ease-in-out',
            'max-sm:h-[54px] max-sm:p-2 max-sm:text-xs',
            selected && '!bg-buttonBlack [&>div]:text-text',
            disabled && '!cursor-not-allowed text-subText/40',
          )}
        >
          <img src={icon} alt="Switch Network" style={{ height: '20px', width: '20px', borderRadius: '4px' }} />
          <Row className="grow gap-1.5">
            <span className="relative text-left">
              {name}
              {deprecatedSoon && (
                <MaintainLabel style={{ position: 'absolute', top: '20%', right: '-90%' }}>Deprecating</MaintainLabel>
              )}
            </span>

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
              <div className="ml-auto mr-1 h-[18px] w-[18px] [&>img]:h-[18px] [&>img]:w-[18px]">
                <img src={connector.icon} alt="" />
              </div>
            )}
          </Row>
          {!isMobile && (
            <div className="hidden cursor-grab opacity-0 group-hover:block group-hover:opacity-100">
              <Icon id="drag-indicator" className="text-border" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </MouseoverTooltip>
  )
}

export default DraggableNetworkButton
