import { useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { MEDIA_WIDTHS } from 'theme'

const DropdownWrapper = styled.div<{ mobileFullWidth: boolean }>`
  position: relative;
  width: fit-content;

  ${({ theme, mobileFullWidth }) => theme.mediaWidth.upToSmall`
    ${mobileFullWidth && 'width: 100%;'}
  `}
`

const DropdownTitleWrapper = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 30px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  justify-content: center;
`

const DropdownTitle = styled.div<{ width?: number }>`
  width: ${({ width }) => (width ? `${width}px` : '')};
  min-width: ${({ width }) => (!width ? '100px' : 'max-content')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-transform: capitalize;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: max-content;
  `}
`

const DropdownIcon = styled(DropdownSVG)<{ open: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s;
`

const ItemIcon = styled.img`
  width: 18px;
  height: 18px;
`

const DropdownContent = styled.div<{ alignLeft: boolean }>`
  position: absolute;
  top: 42px;
  left: 0;
  background: ${({ theme }) => theme.background};
  border-radius: 24px;
  padding: 8px 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: ${({ alignLeft }) => (alignLeft ? 'flex-start' : 'center')};
  gap: 4px;
  max-height: 218px;
  overflow-y: auto;
  z-index: 100;
  filter: brightness(1.2);
`

const DropdownContentItem = styled.div`
  padding: 8px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  text-transform: capitalize;

  &:hover {
    background: ${({ theme }) => theme.tableHeader};
  }
`

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
  onChange,
}: {
  options: MenuOption[]
  value: string | number
  width?: number
  alignLeft?: boolean
  mobileFullWidth?: boolean
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
    <DropdownWrapper mobileFullWidth={mobileFullWidth} ref={ref}>
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
