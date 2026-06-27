import { t } from '@lingui/macro'
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'react-feather'

import { MenuOption } from 'pages/Earns/components/DropdownMenu'
import {
  DropdownContent,
  DropdownIcon,
  DropdownTitle,
  DropdownTitleWrapper,
  DropdownWrapper,
  ItemIcon,
  MultiSelectDropdownContentItem,
} from 'pages/Earns/components/DropdownMenu/styles'

const AllOptionValue = ''

const MultiSelect = ({
  label,
  options,
  value,
  width,
  alignItems = 'flex-start',
  mobileFullWidth = false,
  mobileHalfWidth = false,
  highlightOnSelect = false,
  showOnlyButton = false,
  emptyValueOnClear,
  onChange,
}: {
  label: ReactNode
  options: MenuOption[]
  value: string
  width?: number
  alignItems?: CSSProperties['alignItems']
  mobileFullWidth?: boolean
  mobileHalfWidth?: boolean
  highlightOnSelect?: boolean
  showOnlyButton?: boolean
  emptyValueOnClear?: string
  onChange: (value: string | number) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const parsedValue = useMemo(() => value.split(','), [value])

  const handleOpenChange = () => setOpen(!open)

  const handleSelectOnly = (event: React.MouseEvent, newValue: string) => {
    event.stopPropagation()
    onChange(newValue)
    setOpen(false)
  }

  const handleSelectItem = (newValue: string) => {
    if (value === AllOptionValue) {
      onChange(newValue)
      return
    }
    const arrValue = value.split(',')
    if (arrValue.includes(newValue)) {
      arrValue.splice(arrValue.indexOf(newValue), 1)
    } else {
      arrValue.push(newValue)
    }
    if (arrValue.length === 0) {
      if (options.some(option => option.value === AllOptionValue)) {
        onChange(AllOptionValue)
      } else if (emptyValueOnClear !== undefined) {
        onChange(emptyValueOnClear)
      } else {
        onChange(options.map(option => option.value).join(','))
      }
    } else {
      if (arrValue.includes(AllOptionValue)) {
        onChange(AllOptionValue)
      } else {
        onChange(arrValue.join(','))
      }
    }
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
      <DropdownTitleWrapper highlight={highlightOnSelect && value !== AllOptionValue} onClick={handleOpenChange}>
        <DropdownTitle width={width}>{label}</DropdownTitle>
        <DropdownIcon open={open} />
      </DropdownTitleWrapper>
      {open && (
        <DropdownContent alignItems={alignItems} standalone>
          {options.map((option: MenuOption) => (
            <MultiSelectDropdownContentItem
              key={option.value}
              className={showOnlyButton ? 'group w-full' : undefined}
              onClick={() => handleSelectItem(option.value)}
            >
              {showOnlyButton ? (
                <>
                  <div className="flex items-center gap-2">
                    {option.icon && <ItemIcon src={option.icon} alt={option.label} />}
                    {option.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {option.value !== AllOptionValue && (
                      <button
                        type="button"
                        className="pointer-events-none rounded-full bg-primary-20 px-2 py-1.5 text-xs font-medium leading-none text-primary opacity-0 transition-opacity hover:bg-primary-30 group-hover:pointer-events-auto group-hover:opacity-100"
                        onClick={event => handleSelectOnly(event, option.value)}
                      >
                        {t`Only`}
                      </button>
                    )}
                    <div className="flex w-3.5 shrink-0 justify-center">
                      {parsedValue.includes(option.value) && <Check size={14} />}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {option.icon && <ItemIcon src={option.icon} alt={option.label} />}
                  {option.label}
                  {parsedValue.includes(option.value) && <Check size={14} />}
                </>
              )}
            </MultiSelectDropdownContentItem>
          ))}
        </DropdownContent>
      )}
    </DropdownWrapper>
  )
}

export default MultiSelect
