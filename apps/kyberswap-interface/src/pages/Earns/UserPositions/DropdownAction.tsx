import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, MoreVertical, Plus } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as IconClaimRewards } from 'assets/svg/earn/ic_claim.svg'
import { ReactComponent as IconClaimFees } from 'assets/svg/earn/ic_earn_claim_fees.svg'
import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'
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
  claimFees: { onClaimFee, feesClaimDisabled, feesClaiming, positionThatClaimingFees },
  claimRewards: { onClaimRewards, rewardsClaimDisabled, rewardsClaiming, positionThatClaimingRewards },
}: {
  position: ParsedPosition
  onOpenIncreaseLiquidityWidget: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenZapOut: (e: React.MouseEvent, position: ParsedPosition) => void
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
}) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const updatePortalPosition = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPortalPosition({
      top: rect.bottom + 5,
      left: rect.right - 200,
    })
  }

  useEffect(() => {
    if (open) {
      updatePortalPosition()
      window.addEventListener('scroll', updatePortalPosition, true)
      window.addEventListener('resize', updatePortalPosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePortalPosition, true)
      window.removeEventListener('resize', updatePortalPosition)
    }
  }, [open])

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

  const renderActionItems = () => (
    <>
      <DropdownContentItem
        onClick={e => {
          e.stopPropagation()
          handleAction(e, onOpenIncreaseLiquidityWidget)
        }}
      >
        <Plus size={16} />
        <Text>{position.status === PositionStatus.CLOSED ? t`Add Liquidity` : t`Increase Liquidity`}</Text>
      </DropdownContentItem>
      <DropdownContentItem
        disabled={position.status === PositionStatus.CLOSED}
        onClick={e => {
          e.stopPropagation()
          if (position.status === PositionStatus.CLOSED) return
          handleAction(e, onOpenZapOut)
        }}
      >
        <Minus size={16} />
        <Text>{t`Remove Liquidity`}</Text>
      </DropdownContentItem>
      <DropdownContentItem
        disabled={feesClaimDisabled}
        onClick={e => {
          e.stopPropagation()
          if (!feesClaimDisabled) {
            handleAction(e, onClaimFee)
          } else e.preventDefault()
        }}
      >
        {feesClaiming && positionThatClaimingFees && positionThatClaimingFees.tokenId === position.tokenId ? (
          <Loader size={'16px'} stroke={'#7a7a7a'} />
        ) : (
          <IconClaimFees width={16} />
        )}
        <Text>{t`Claim Fees`}</Text>
      </DropdownContentItem>
      <DropdownContentItem
        disabled={rewardsClaimDisabled}
        onClick={e => {
          e.stopPropagation()
          if (!rewardsClaimDisabled) {
            handleAction(e, onClaimRewards)
          } else e.preventDefault()
        }}
      >
        {rewardsClaiming && positionThatClaimingRewards && positionThatClaimingRewards.tokenId === position.tokenId ? (
          <Loader size={'16px'} stroke={'#7a7a7a'} />
        ) : (
          <IconClaimRewards width={14} style={{ marginRight: '2px' }} />
        )}
        <Text>{t`Claim Rewards`}</Text>
      </DropdownContentItem>
    </>
  )

  return (
    <DropdownWrapper ref={ref}>
      <DropdownTitleWrapper open={open} onClick={handleOpenChange}>
        <MoreVertical color={theme.subText} size={18} />
      </DropdownTitleWrapper>
      {!upToExtraSmall &&
        open &&
        createPortal(
          <DropdownContent style={portalPosition} data-dropdown-content>
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
