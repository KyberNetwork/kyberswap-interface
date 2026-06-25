import Portal from '@reach/portal'
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import {
  DropdownContent,
  DropdownContentItem,
  DropdownContentWrapper,
  DropdownIcon,
  DropdownLabel,
  DropdownTitle,
  DropdownTitleWrapper,
  DropdownWrapper,
  ItemIcon,
  ScrollIndicator,
} from 'pages/Earns/components/DropdownMenu/styles'

export interface MenuOption {
  label: string
  value: string
  icon?: string
}

const DropdownMenu = ({
  options,
  value,
  width,
  tooltip,
  flatten,
  background,
  fullWidth = false,
  alignItems = 'flex-start',
  mobileFullWidth = false,
  mobileHalfWidth = false,
  usePortal = false,
  onChange,
}: {
  options: MenuOption[]
  value: string | number
  width?: number
  tooltip?: string
  flatten?: boolean
  background?: string
  fullWidth?: boolean
  alignItems?: CSSProperties['alignItems']
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  usePortal?: boolean
  onChange: (value: string | number) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, minWidth: 0 })
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const optionValue = useMemo(() => options.find(option => option.value === value), [options, value])

  const handleOpenChange = () => setOpen(!open)

  const handleSelectItem = (newValue: string | number) => {
    onChange(newValue)
    setOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is outside both the wrapper and the dropdown content
      if (!ref?.current?.contains(target) && !contentRef?.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref])

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  useEffect(() => {
    if (!open) return
    // Check after render so content height is measured
    requestAnimationFrame(updateScrollIndicators)
  }, [open, updateScrollIndicators])

  // compute dropdown position when rendered in portal
  useEffect(() => {
    if (!open || !usePortal) return
    const el = ref.current
    if (!el) return

    const computePosition = () => {
      const rect = el.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4, // small offset for spacing
        left: rect.left,
        minWidth: rect.width,
      })
    }

    computePosition()
    window.addEventListener('resize', computePosition)
    // capture scrolls from any scrollable parents
    window.addEventListener('scroll', computePosition, true)

    return () => {
      window.removeEventListener('resize', computePosition)
      window.removeEventListener('scroll', computePosition, true)
    }
  }, [open, usePortal, alignItems])

  const handleScrollClick = (direction: 'up' | 'down') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: direction === 'up' ? -100 : 100, behavior: 'smooth' })
  }

  const dropdownContent = (
    <DropdownContentWrapper ref={contentRef} flatten={flatten} style={usePortal ? { ...position } : undefined}>
      <ScrollIndicator $visible={canScrollUp} onClick={() => handleScrollClick('up')}>
        <ChevronUp size={16} />
      </ScrollIndicator>
      <DropdownContent ref={scrollRef} alignItems={alignItems} onScroll={updateScrollIndicators}>
        {options.map((option: MenuOption) => (
          <DropdownContentItem
            key={option.value}
            onClick={() => handleSelectItem(option.value)}
            className={option.value === value ? 'selected' : ''}
          >
            {option.icon && <ItemIcon src={option.icon} alt={option.label} />}
            {option.label}
          </DropdownContentItem>
        ))}
      </DropdownContent>
      <ScrollIndicator $visible={canScrollDown} onClick={() => handleScrollClick('down')}>
        <ChevronDown size={16} />
      </ScrollIndicator>
    </DropdownContentWrapper>
  )

  return (
    <DropdownWrapper
      mobileFullWidth={mobileFullWidth}
      mobileHalfWidth={mobileHalfWidth}
      fullWidth={fullWidth}
      ref={ref}
    >
      <MouseoverTooltipDesktopOnly text={!open && tooltip} placement="top" width="260px">
        <DropdownTitleWrapper
          flatten={flatten}
          background={background}
          highlight={flatten && open}
          onClick={handleOpenChange}
        >
          <DropdownTitle justifyContent={alignItems} width={width} fullWidth={fullWidth && !width}>
            {optionValue?.icon && <ItemIcon src={optionValue.icon} alt={optionValue.label} />}
            <DropdownLabel>{optionValue?.label}</DropdownLabel>
          </DropdownTitle>
          <DropdownIcon $flatten={flatten} open={open} />
        </DropdownTitleWrapper>
      </MouseoverTooltipDesktopOnly>
      {open && (usePortal ? <Portal>{dropdownContent}</Portal> : dropdownContent)}
    </DropdownWrapper>
  )
}

export default DropdownMenu
