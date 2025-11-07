import { useEffect, useMemo, useRef, useState } from 'react'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import {
  DropdownContent,
  DropdownContentItem,
  DropdownIcon,
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
  alignLeft = false,
  mobileFullWidth = false,
  mobileHalfWidth = false,
  onChange,
}: {
  options: MenuOption[]
  value: string | number
  width?: number
  tooltip?: string
  flatten?: boolean
  alignLeft?: boolean
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  onChange: (value: string | number) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const optionValue = useMemo(() => options.find(option => option.value === value), [options, value])

  const handleOpenChange = () => setOpen(!open)

  const handleSelectItem = (newValue: string | number) => {
    onChange(newValue)
    setOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref?.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref])

  return (
    <DropdownWrapper mobileFullWidth={mobileFullWidth} mobileHalfWidth={mobileHalfWidth} ref={ref}>
      <MouseoverTooltipDesktopOnly text={!open && tooltip} placement="top" width="260px">
        <DropdownTitleWrapper flatten={flatten} highlight={flatten && open} onClick={handleOpenChange}>
          <DropdownTitle width={width}>
            {optionValue?.icon && <ItemIcon src={optionValue.icon} alt={optionValue.label} />}
            {/* {(!upToExtraSmall || !optionValue?.icon) && optionValue?.label} */}
            {optionValue?.label}
          </DropdownTitle>
          <DropdownIcon flatten={flatten} open={open} />
        </DropdownTitleWrapper>
      </MouseoverTooltipDesktopOnly>
      {open && (
        <DropdownContent flatten={flatten} alignLeft={alignLeft}>
          {options.map((option: MenuOption) => (
            <DropdownContentItem key={option.value} onClick={() => handleSelectItem(option.value)}>
              {option.icon && <ItemIcon src={option.icon} alt={option.label} />}
              {option.label}
            </DropdownContentItem>
          ))}
        </DropdownContent>
      )}
    </DropdownWrapper>
  )
}

export default DropdownMenu
