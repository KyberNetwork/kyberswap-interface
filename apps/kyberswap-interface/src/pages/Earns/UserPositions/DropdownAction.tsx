import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, MoreVertical, Plus } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as IconClaimRewards } from 'assets/svg/earn/ic_claim.svg'
import { ReactComponent as IconClaimFees } from 'assets/svg/earn/ic_earn_claim_fees.svg'
import { ReactComponent as IconReposition } from 'assets/svg/earn/ic_reposition.svg'
import { ReactComponent as IconSmartExit } from 'assets/svg/smart_exit.svg'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { DexMapping } from 'pages/Earns/components/SmartExit/useSmartExit'
import { EARN_CHAINS, EarnChain } from 'pages/Earns/constants'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const DropdownWrapper = styled.div`
  position: relative;
  width: fit-content;
`

const DropdownTitleWrapper = styled.div<{ open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 12px;
  background: ${({ theme, open }) => (open ? theme.tabActive : 'inherit')};
  transform: scale(1.1);
  position: relative;
  top: 5px;
  cursor: pointer;

  ${({ theme, open }) => theme.mediaWidth.upToSmall`
    background: ${open ? theme.buttonGray : theme.tabActive};
  `}
`

const DropdownContent = styled.div`
  position: fixed;
  background: ${({ theme }) => theme.tabActive};
  border-radius: 12px;
  padding: 14px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: 'flex-start';
  gap: 4px;
  z-index: 1000;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
  will-change: top, left;
`

const DropdownContentItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  align-items: center;
  align-self: stretch;
  justify-content: flex-start;
  text-transform: capitalize;
  cursor: pointer;

  &:hover {
    color: ${({ theme, disabled }) => (disabled ? theme.subText : theme.primary)};
  }

  ${({ disabled, theme }) =>
    disabled &&
    `
      cursor: not-allowed;
      color: ${theme.subText};
      filter: brightness(0.6) !important;
    `}
`

const BottomDrawer = styled.div<{ open: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.tabActive};
  border-radius: 20px 20px 0 0;
  padding: 16px;
  transform: translateY(${({ open }) => (open ? '-60px' : '100%')});
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
`

const DrawerContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Overlay = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${({ open }) => (open ? 1 : 0)};
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease-in-out;
  z-index: 999;
`

const DropdownAction = ({
  position,
  onOpenIncreaseLiquidityWidget,
  onOpenZapOut,
  onOpenSmartExit,
  onOpenReposition,
  claimFees: { onClaimFee, feesClaimDisabled, feesClaiming, positionThatClaimingFees },
  claimRewards: { onClaimRewards, rewardsClaimDisabled, rewardsClaiming, positionThatClaimingRewards },
  hasActiveSmartExitOrder,
}: {
  position: ParsedPosition
  onOpenIncreaseLiquidityWidget: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenZapOut: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenSmartExit: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenReposition: (e: React.MouseEvent, position: ParsedPosition) => void
  claimFees: {
    onClaimFee: (e: React.MouseEvent, position: ParsedPosition) => void
    feesClaimDisabled: boolean
    feesClaiming: boolean
    positionThatClaimingFees: ParsedPosition | null
  }
  claimRewards: {
    onClaimRewards: (e: React.MouseEvent, position: ParsedPosition) => void
    rewardsClaimDisabled: boolean
    rewardsClaiming: boolean
    positionThatClaimingRewards: ParsedPosition | null
  }
  hasActiveSmartExitOrder: boolean
}) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [open, setOpen] = useState(false)
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tickingRef = useRef(false)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const navigate = useNavigate()

  const updatePortalPosition = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const margin = 3
    const upwardGapAdjustment = 10
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const menuWidth = contentRef.current?.offsetWidth ?? 200
    const menuHeight = contentRef.current?.offsetHeight ?? 0

    const diagonalHorizontalOffset = 22
    let left = rect.right - menuWidth - diagonalHorizontalOffset
    if (left < margin) left = margin
    if (left + menuWidth > viewportWidth - margin) left = Math.max(viewportWidth - menuWidth - margin, margin)

    const spaceAbove = rect.top - margin
    const spaceBelow = viewportHeight - rect.bottom - margin
    const preferUpward = spaceAbove > spaceBelow + 22

    let top = rect.bottom + margin
    const willOverflowBottom = top + menuHeight > viewportHeight - margin
    const canOpenUp = spaceAbove >= margin
    if ((willOverflowBottom && canOpenUp) || (preferUpward && canOpenUp)) {
      const effectiveGap = Math.max(margin - upwardGapAdjustment, -7)
      top = Math.max(rect.top - menuHeight - effectiveGap, margin)
    } else if (willOverflowBottom) {
      top = Math.max(viewportHeight - menuHeight - margin, margin)
    }

    setPortalPosition(prev => (prev.top === top && prev.left === left ? prev : { top, left }))
  }, [])

  const scheduleUpdatePosition = useCallback(() => {
    if (tickingRef.current) return
    tickingRef.current = true
    requestAnimationFrame(() => {
      updatePortalPosition()
      tickingRef.current = false
    })
  }, [updatePortalPosition])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => updatePortalPosition())
      const options = { capture: true, passive: true } as AddEventListenerOptions
      window.addEventListener('scroll', scheduleUpdatePosition, options)
      window.addEventListener('resize', scheduleUpdatePosition, options)
    }
    return () => {
      window.removeEventListener('scroll', scheduleUpdatePosition, true)
      window.removeEventListener('resize', scheduleUpdatePosition, true)
    }
  }, [open, scheduleUpdatePosition, updatePortalPosition])

  const handleOpenChange = (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(!open)
  }

  const handleAction = (e: React.MouseEvent, action: (e: React.MouseEvent, position: ParsedPosition) => void) => {
    setOpen(false)
    action(e, position)
  }

  const onClickOverlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const portalContent = document.querySelector('[data-dropdown-content]')
      if (!ref?.current?.contains(event.target as Node) && !portalContent?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref])

  const increaseDisabled = position.status === PositionStatus.CLOSED && position.pool.isUniv4
  const removeDisabled = position.status === PositionStatus.CLOSED
  const repositionDisabled = position.status === PositionStatus.CLOSED || position.pool.isUniv2
  const smartExitDisabled =
    !Object.keys(DexMapping).includes(position.dex.id) ||
    !EARN_CHAINS[position.chain.id as unknown as EarnChain].smartExitSupported ||
    position.status === PositionStatus.CLOSED ||
    (position.stakingOwner ? account !== position.stakingOwner : false)

  const dexName = position.dex.name
  const chainName = position.chain.name
  const actionItems = [
    {
      label: t`Increase Liquidity`,
      disabled: increaseDisabled,
      icon: <Plus size={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (increaseDisabled) return
        handleAction(e, onOpenIncreaseLiquidityWidget)
      },
    },
    {
      label: t`Remove Liquidity`,
      disabled: removeDisabled,
      icon: <Minus size={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (removeDisabled) return
        handleAction(e, onOpenZapOut)
      },
    },
    {
      label: t`Claim Fees`,
      disabled: feesClaimDisabled,
      icon:
        feesClaiming && positionThatClaimingFees && positionThatClaimingFees.tokenId === position.tokenId ? (
          <Loader size={'16px'} stroke={'#7a7a7a'} />
        ) : (
          <IconClaimFees width={16} />
        ),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!feesClaimDisabled) handleAction(e, onClaimFee)
        else e.preventDefault()
      },
    },
    {
      label: t`Claim Rewards`,
      disabled: rewardsClaimDisabled,
      icon:
        rewardsClaiming && positionThatClaimingRewards && positionThatClaimingRewards.tokenId === position.tokenId ? (
          <Loader size={'16px'} stroke={'#7a7a7a'} />
        ) : (
          <IconClaimRewards width={14} style={{ marginRight: '2px' }} />
        ),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!rewardsClaimDisabled) handleAction(e, onClaimRewards)
        else e.preventDefault()
      },
    },
    {
      label: t`Reposition`,
      disabled: repositionDisabled,
      icon: <IconReposition width={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (repositionDisabled) return
        handleAction(e, onOpenReposition)
      },
    },
    {
      label: hasActiveSmartExitOrder ? t`View Smart Exit Orders` : t`Smart Exit`,
      disabled: smartExitDisabled,
      disabledTooltip: !Object.keys(DexMapping).includes(position.dex.id)
        ? t`Smart Exit is currently not supported on ${dexName}`
        : !EARN_CHAINS[position.chain.id as unknown as EarnChain].smartExitSupported
        ? t`Smart Exit is currently not supported on ${chainName}`
        : position.stakingOwner && account !== position.stakingOwner
        ? t`Position is in farming in another protocol`
        : '',
      icon: <IconSmartExit width={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (hasActiveSmartExitOrder) {
          navigate(APP_PATHS.EARN_SMART_EXIT)
          return
        }
        if (smartExitDisabled) return
        handleAction(e, onOpenSmartExit)
      },
    },
  ]

  const renderActionItems = () =>
    actionItems.map((item, index) =>
      item.disabledTooltip ? (
        <MouseoverTooltip key={index} text={item.disabledTooltip} width="fit-content" placement="left">
          <DropdownContentItem disabled={item.disabled} onClick={item.onClick}>
            {item.icon}
            <Text>{item.label}</Text>
          </DropdownContentItem>
        </MouseoverTooltip>
      ) : (
        <DropdownContentItem key={index} disabled={item.disabled} onClick={item.onClick}>
          {item.icon}
          <Text>{item.label}</Text>
        </DropdownContentItem>
      ),
    )

  return (
    <DropdownWrapper ref={ref}>
      <DropdownTitleWrapper open={open} onClick={handleOpenChange}>
        <MoreVertical color={theme.subText} size={18} />
      </DropdownTitleWrapper>
      {!upToExtraSmall &&
        open &&
        createPortal(
          <DropdownContent ref={contentRef} style={portalPosition} data-dropdown-content>
            {renderActionItems()}
          </DropdownContent>,
          document.body,
        )}
      {upToExtraSmall && (
        <>
          <Overlay open={open} onClick={onClickOverlay} />
          <BottomDrawer open={open}>
            <DrawerContent>{renderActionItems()}</DrawerContent>
          </BottomDrawer>
        </>
      )}
    </DropdownWrapper>
  )
}

export default DropdownAction
