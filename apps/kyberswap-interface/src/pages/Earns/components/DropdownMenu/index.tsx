import Portal from '@reach/portal'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import {
  DropdownContent,
  DropdownContentItem,
  DropdownIcon,
  DropdownLabel,
  DropdownTitle,
  DropdownTitleWrapper,
  DropdownWrapper,
  ItemIcon,
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
  fullWidth = false,
  alignLeft = false,
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
  fullWidth?: boolean
  alignLeft?: boolean
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  usePortal?: boolean
  onChange: (value: string | number) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, minWidth: 0 })

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
  }, [open, usePortal, alignLeft])

  const dropdownContent = (
    <DropdownContent
      ref={contentRef}
      flatten={flatten}
      alignLeft={alignLeft}
      style={usePortal ? { ...position } : undefined}
    >
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
  )

  return (
    <DropdownWrapper
      mobileFullWidth={mobileFullWidth}
      mobileHalfWidth={mobileHalfWidth}
      fullWidth={fullWidth}
      ref={ref}
    >
      <MouseoverTooltipDesktopOnly text={!open && tooltip} placement="top" width="260px">
        <DropdownTitleWrapper flatten={flatten} highlight={flatten && open} onClick={handleOpenChange}>
          <DropdownTitle
            justifyContent={alignLeft ? 'flex-start' : 'center'}
            width={width}
            fullWidth={fullWidth && !width}
          >
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
