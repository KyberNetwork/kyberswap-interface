import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'

import {
  DropdownContent,
  DropdownContentItem,
  DropdownIcon,
  DropdownTitle,
  DropdownTitleWrapper,
  DropdownWrapper,
  ItemIcon,
} from 'pages/Earns/components/DropdownMenu/styles'
import { MEDIA_WIDTHS } from 'theme'

export interface MenuOption {
  label: string
  value: string
  icon?: string
}

const DropdownMenu = ({
  options,
  value,
  width,
  alignLeft = false,
  mobileFullWidth = false,
  mobileHalfWidth = false,
  onChange,
}: {
  options: MenuOption[]
  value: string | number
  width?: number
  alignLeft?: boolean
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  onChange: (value: string | number) => void
}) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

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
      <DropdownTitleWrapper onClick={handleOpenChange}>
        <DropdownTitle width={width}>
          {optionValue?.icon && <ItemIcon src={optionValue.icon} alt={optionValue.label} />}
          {(!upToExtraSmall || !optionValue?.icon) && optionValue?.label}
        </DropdownTitle>
        <DropdownIcon open={open} />
      </DropdownTitleWrapper>
      {open && (
        <DropdownContent alignLeft={alignLeft}>
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
