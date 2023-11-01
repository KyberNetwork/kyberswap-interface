import { t } from '@lingui/macro'
import { Placement } from '@popperjs/core'
import { Portal } from '@reach/portal'
import { AnimatePresence, motion } from 'framer-motion'
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import styled from 'styled-components'

import Icon from 'components/Icons/Icon'
import { Z_INDEXS } from 'constants/styles'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

import { DropdownArrowIcon } from '../ArrowRotate'

const SelectWrapper = styled.div`
  cursor: pointer;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 12px;
  :hover {
    filter: brightness(1.2);
  }
`

const SelectMenu = styled(motion.div)`
  padding: 8px;
  border-radius: 16px;
  overflow: hidden;
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  z-index: 2;
  background: ${({ theme }) => theme.tabActive};
  width: max-content;
`

const Option = styled.div<{ $selected: boolean }>`
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  white-space: nowrap;
  &:hover {
    background-color: ${({ theme }) => theme.background};
  }
  font-weight: ${({ $selected }) => ($selected ? '500' : 'unset')};
`

const SelectedWrap = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  user-select: none;
`

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.buttonGray};
  margin-bottom: 8px;
  transition: all 0.1s ease;
  transition-property: background-color, color;
  color: ${({ theme }) => theme.subText};
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
    color: ${({ theme }) => theme.text};
  }
  :focus-within {
    background-color: ${({ theme }) => theme.buttonBlack};
    color: ${({ theme }) => theme.text};
  }
  input {
    width: 100%;
    padding-inline-start: 40px;
    line-height: 32px;
    color: ${({ theme }) => theme.text};
  }
`
export type SelectOption = { value?: string | number; label: ReactNode; onSelect?: () => void }

const getOptionValue = (option: SelectOption | undefined) => {
  if (!option) return ''
  return typeof option !== 'object' ? option : option.value ?? ''
}
const getOptionLabel = (option: SelectOption | undefined) => {
  if (!option) return ''
  return typeof option !== 'object' ? option : option.label || option.value
}

const defaultOffset: [number, number] = [0 /* skidding */, 2 /* distance */]
function Select({
  options = [],
  activeRender,
  optionRender,
  style = {},
  menuStyle = {},
  optionStyle = {},
  onChange,
  value: selectedValue,
  className,
  forceMenuPlacementTop = false,
  arrowColor,
  dropdownRender,
  onHideMenu,
  withSearch,
  placement = 'bottom',
}: {
  value?: string | number
  className?: string
  options: SelectOption[]
  dropdownRender?: (menu: ReactNode) => ReactNode
  activeRender?: (selectedItem: SelectOption | undefined) => ReactNode
  optionRender?: (option: SelectOption | undefined) => ReactNode
  style?: CSSProperties
  menuStyle?: CSSProperties
  optionStyle?: CSSProperties
  onChange?: (value: any) => void
  forceMenuPlacementTop?: boolean
  arrowColor?: string
  placement?: string
  withSearch?: boolean
  onHideMenu?: () => void // hide without changes
}) {
  const [selected, setSelected] = useState(getOptionValue(options?.[0]))
  const [showMenu, setShowMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuPlacementTop] = useState(forceMenuPlacementTop)

  useEffect(() => {
    const findValue = options.find(item => getOptionValue(item) === selectedValue)?.value
    setSelected(findValue || getOptionValue(options?.[0]))
  }, [selectedValue, options])

  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => {
    setShowMenu(false)
    onHideMenu?.()
  })
  const selectedInfo = options.find(item => getOptionValue(item) === selected)

  const renderMenu = () => {
    return options
      .filter(item => {
        if (!withSearch) return true
        return item.label?.toString().toLowerCase().includes(searchValue.toLowerCase())
      })
      .map(item => {
        const value = getOptionValue(item)
        const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation()
          e.preventDefault()
          setShowMenu(false)
          setSearchValue('')
          if (item.onSelect) item.onSelect?.()
          else {
            setSelected(value)
            onChange?.(value)
          }
        }
        return (
          <Option
            key={value}
            role="button"
            $selected={value === selectedValue || value === getOptionValue(selectedInfo)}
            onClick={onClick}
            style={optionStyle}
          >
            {optionRender ? optionRender(item) : getOptionLabel(item)}
          </Option>
        )
      })
  }

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)

  const { styles } = usePopper(ref.current, popperElement, {
    placement: placement as Placement,
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: defaultOffset } }],
  })

  return (
    <SelectWrapper
      ref={ref}
      role="button"
      onClick={() => {
        setShowMenu(v => !v)
      }}
      style={style}
      className={className}
    >
      <SelectedWrap>{activeRender ? activeRender(selectedInfo) : getOptionLabel(selectedInfo)}</SelectedWrap>
      <DropdownArrowIcon rotate={showMenu} color={arrowColor} />
      <AnimatePresence>
        {showMenu && (
          <Portal>
            <div
              ref={setPopperElement}
              style={{
                ...styles.popper,
                ...(menuPlacementTop ? { bottom: 40, top: 'unset' } : {}),
                zIndex: Z_INDEXS.POPOVER_CONTAINER,
              }}
            >
              <SelectMenu
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={menuStyle}
              >
                {withSearch && (
                  <SearchWrapper onClick={e => e.stopPropagation()}>
                    <span style={{ position: 'absolute', left: '8px' }}>
                      <Icon id="search" />
                    </span>
                    <input
                      placeholder={t`Search...`}
                      style={{ background: 'transparent', outline: 'none', border: 'none' }}
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                    />
                  </SearchWrapper>
                )}
                <div>{dropdownRender ? dropdownRender(renderMenu()) : renderMenu()}</div>
              </SelectMenu>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </SelectWrapper>
  )
}

export default styled(Select)``
