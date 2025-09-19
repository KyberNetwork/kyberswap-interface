import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'react-feather'

import { MenuOption } from 'pages/Earns/components/DropdownMenu'
import {
  DropdownContent,
  DropdownIcon,
  DropdownTitle,
  DropdownTitleWrapper,
  DropdownWrapper,
  MultiSelectDropdownContentItem,
} from 'pages/Earns/components/DropdownMenu/styles'

const MultiSelect = ({
  label,
  options,
  value,
  width,
  alignLeft = false,
  mobileFullWidth = false,
  mobileHalfWidth = false,
  onChange,
}: {
  label: string
  options: MenuOption[]
  value: string
  width?: number
  alignLeft?: boolean
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  onChange: (value: string | number) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const parsedValue = useMemo(() => value.split(','), [value])

  const handleOpenChange = () => setOpen(!open)

  const handleSelectItem = (newValue: string) => {
    const arrValue = value.split(',')
    if (arrValue.includes(newValue)) {
      arrValue.splice(arrValue.indexOf(newValue), 1)
    } else {
      arrValue.push(newValue)
    }
    if (arrValue.length === 0) {
      onChange(options.map(option => option.value).join(','))
    } else onChange(arrValue.join(','))
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
        <DropdownTitle width={width}>{label}</DropdownTitle>
        <DropdownIcon open={open} />
      </DropdownTitleWrapper>
      {open && (
        <DropdownContent alignLeft={alignLeft}>
          {options.map((option: MenuOption) => (
            <MultiSelectDropdownContentItem key={option.value} onClick={() => handleSelectItem(option.value)}>
              {option.label}
              {parsedValue.includes(option.value) && <Check size={14} />}
            </MultiSelectDropdownContentItem>
          ))}
        </DropdownContent>
      )}
    </DropdownWrapper>
  )
}

export default MultiSelect
