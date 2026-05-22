import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, MoreVertical, Plus } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'

import { ReactComponent as IconClaimRewards } from 'assets/svg/earn/ic_claim.svg'
import { ReactComponent as IconClaimFees } from 'assets/svg/earn/ic_earn_claim_fees.svg'
import { ReactComponent as ListSmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as IconReposition } from 'assets/svg/earn/ic_reposition.svg'
import { ReactComponent as IconSmartExit } from 'assets/svg/earn/ic_smart_exit.svg'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { EARN_CHAINS, EARN_DEXES, EarnChain } from 'pages/Earns/constants'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const DropdownAction = ({
  position,
  onOpenIncreaseLiquidityWidget,
  onOpenZapOut,
  onOpenSmartExit,
  onOpenReposition,
  claimFees: { onClaimFee, feesClaimDisabled, feesClaiming },
  claimRewards: { onClaimRewards, rewardsClaimDisabled, rewardsClaiming },
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
  }
  claimRewards: {
    onClaimRewards: (e: React.MouseEvent, position: ParsedPosition) => void
    rewardsClaimDisabled: boolean
    rewardsClaiming: boolean
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
    !EARN_DEXES[position.dex.id].smartExitDexType ||
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
      label: hasActiveSmartExitOrder ? t`View Smart Exit Orders` : t`Smart Exit`,
      disabled: smartExitDisabled,
      disabledTooltip: !EARN_DEXES[position.dex.id].smartExitDexType
        ? t`Smart Exit is currently not supported on ${dexName}`
        : !EARN_CHAINS[position.chain.id as unknown as EarnChain].smartExitSupported
        ? t`Smart Exit is currently not supported on ${chainName}`
        : position.stakingOwner && account !== position.stakingOwner
        ? t`Position is in farming in another protocol`
        : '',
      icon: hasActiveSmartExitOrder ? <ListSmartExitIcon width={16} /> : <IconSmartExit width={16} />,
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
      label: t`Claim Fees`,
      disabled: feesClaimDisabled,
      icon: feesClaiming ? <Loader size={'16px'} stroke={'#7a7a7a'} /> : <IconClaimFees width={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!feesClaimDisabled) handleAction(e, onClaimFee)
        else e.preventDefault()
      },
    },
    {
      label: t`Claim Rewards`,
      disabled: rewardsClaimDisabled,
      icon: rewardsClaiming ? (
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
      label: t`Remove Liquidity`,
      disabled: removeDisabled,
      icon: <Minus size={16} />,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (removeDisabled) return
        handleAction(e, onOpenZapOut)
      },
    },
  ]

  const dropdownContentItemClass = (disabled?: boolean) =>
    cn(
      'flex cursor-pointer items-center gap-2 self-stretch px-4 py-2 capitalize hover:text-primary',
      disabled && 'cursor-not-allowed text-subText !brightness-[0.6] hover:text-subText',
    )

  const renderActionItems = () =>
    actionItems.map((item, index) =>
      item.disabledTooltip ? (
        <MouseoverTooltip key={index} text={item.disabledTooltip} width="fit-content" placement="left">
          <div className={dropdownContentItemClass(item.disabled)} onClick={item.onClick}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        </MouseoverTooltip>
      ) : (
        <div key={index} className={dropdownContentItemClass(item.disabled)} onClick={item.onClick}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ),
    )

  return (
    <div ref={ref} className="relative w-fit">
      <div
        onClick={handleOpenChange}
        className={cn(
          'relative top-[5px] flex h-[30px] w-[30px] flex-shrink-0 scale-110 cursor-pointer items-center justify-center rounded-xl',
          open ? 'bg-tabActive max-sm:bg-buttonGray' : 'bg-inherit max-sm:bg-tabActive',
        )}
      >
        <MoreVertical color={theme.subText} size={18} />
      </div>
      {!upToExtraSmall &&
        open &&
        createPortal(
          <div
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
            ref={contentRef}
            style={{ ...portalPosition, willChange: 'top, left' }}
            data-dropdown-content
            className="fixed z-[1000] flex w-max flex-col items-start gap-1 rounded-xl bg-tabActive py-3.5 text-sm text-text shadow-[0px_4px_16px_rgba(0,0,0,0.1)]"
          >
            {renderActionItems()}
          </div>,
          document.body,
        )}
      {upToExtraSmall &&
        createPortal(
          <>
            <div
              onClick={onClickOverlay}
              className={cn(
                'bg-black/50 fixed inset-0 z-[999] transition-opacity duration-300 ease-in-out',
                open ? 'visible opacity-100' : 'invisible opacity-0',
              )}
            />
            <div
              className={cn(
                'fixed inset-x-0 bottom-0 z-[1000] rounded-t-[20px] bg-tabActive p-4 transition-transform duration-300 ease-in-out',
                open ? 'translate-y-0' : 'translate-y-full',
              )}
            >
              <div className="flex flex-col gap-3">{renderActionItems()}</div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

export default DropdownAction
