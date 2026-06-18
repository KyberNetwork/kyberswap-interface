import { t } from '@lingui/macro'
import { Placement } from '@popperjs/core'
import { Portal } from '@reach/portal'
import { AnimatePresence, motion } from 'framer-motion'
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { usePopper } from 'react-popper'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import Icon from 'components/Icons/Icon'
import { Z_INDEXS } from 'constants/styles'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { cn } from 'utils/cn'

export type SelectOption = { value?: string | number; label: ReactNode; onSelect?: () => void; disabled?: boolean }

const getOptionValue = (option: SelectOption | undefined) => {
  if (!option) return ''
  return typeof option !== 'object' ? option : option.value ?? ''
}
const getOptionLabel = (option: SelectOption | undefined) => {
  if (!option) return ''
  return typeof option !== 'object' ? option : option.label || option.value
}

const defaultOffset: [number, number] = [0 /* skidding */, 2 /* distance */]

export type SelectProps = {
  value?: string | number | null
  className?: string
  options: SelectOption[]
  dropdownRender?: (menu: ReactNode) => ReactNode
  activeRender?: (selectedItem: SelectOption | undefined) => ReactNode
  optionRender?: (option: SelectOption | undefined) => ReactNode
  placeholder?: ReactNode
  style?: CSSProperties
  menuStyle?: CSSProperties
  optionStyle?: CSSProperties
  onChange?: (value: any) => void
  forceMenuPlacementTop?: boolean
  arrow?: 'chevron' | 'arrow'
  arrowColor?: string
  arrowSize?: number
  placement?: Placement
  withSearch?: boolean
  onHideMenu?: () => void // hide without changes
  matchMenuWidth?: boolean
}

export default function Select({
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
  arrow = 'arrow',
  arrowColor,
  arrowSize = 24,
  dropdownRender,
  onHideMenu,
  withSearch,
  placement = 'bottom',
  placeholder,
  matchMenuWidth,
}: SelectProps) {
  const hasPlaceholder = placeholder !== undefined && placeholder !== null
  const getInitialSelected = () => {
    const isUnset = selectedValue === null || selectedValue === undefined
    if (hasPlaceholder && isUnset) return ''
    const found = options.find(item => getOptionValue(item) === selectedValue)?.value
    if (found !== undefined) return found
    if (!isUnset && selectedValue !== undefined) return selectedValue
    return getOptionValue(options?.[0])
  }

  const [selected, setSelected] = useState<string | number | undefined>(getInitialSelected())
  const [showMenu, setShowMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuPlacementTop] = useState(forceMenuPlacementTop)

  useEffect(() => {
    const isUnset = selectedValue === null || selectedValue === undefined
    if (hasPlaceholder && isUnset) {
      setSelected('')
      return
    }
    const findValue = options.find(item => getOptionValue(item) === selectedValue)?.value
    if (findValue !== undefined) {
      setSelected(findValue)
      return
    }
    if (!isUnset && selectedValue !== undefined) {
      setSelected(selectedValue)
      return
    }
    setSelected(getOptionValue(options?.[0]))
  }, [selectedValue, options, hasPlaceholder])

  const ref = useRef<HTMLDivElement>(null)
  const popperRef = useRef<HTMLDivElement>()
  const outsideRefs = useMemo(() => [ref, popperRef], [])

  useOnClickOutside(
    outsideRefs,
    () => {
      setShowMenu(false)
      onHideMenu?.()
    },
    { ignoreReachPortal: false },
  )
  const selectedInfo = options.find(item => getOptionValue(item) === selected)
  const shouldShowPlaceholder =
    hasPlaceholder && (selectedValue === null || selectedValue === undefined) && !selectedInfo

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
          if (item.disabled) return
          setShowMenu(false)
          setSearchValue('')
          if (item.onSelect) item.onSelect?.()
          else {
            setSelected(value)
            onChange?.(value)
          }
        }
        const isSelected = value === selectedValue || value === getOptionValue(selectedInfo)
        return (
          <div
            key={value}
            role="button"
            onClick={onClick}
            style={optionStyle}
            className={cn(
              'whitespace-nowrap rounded-lg p-2 text-sm transition-colors',
              item.disabled && 'cursor-not-allowed text-border opacity-50',
              !item.disabled &&
                (isSelected
                  ? 'cursor-pointer bg-primary-10 font-medium text-primary'
                  : 'cursor-pointer text-subText hover:bg-white/[0.04] hover:text-text'),
            )}
          >
            {optionRender ? optionRender(item) : getOptionLabel(item)}
          </div>
        )
      })
  }

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const setPopperRef = (node: HTMLDivElement | null) => {
    popperRef.current = node || undefined
    setPopperElement(node)
  }

  const { styles } = usePopper(ref.current, popperElement, {
    placement: placement,
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: defaultOffset } }],
  })

  return (
    <div
      ref={ref}
      role="button"
      onClick={() => {
        setShowMenu(v => !v)
      }}
      style={style}
      className={cn(
        'relative flex cursor-pointer items-center justify-between rounded-xl bg-buttonBlack p-3 text-xs text-subText hover:brightness-125',
        className,
      )}
    >
      <div className="flex-1 select-none truncate">
        {shouldShowPlaceholder ? placeholder : activeRender ? activeRender(selectedInfo) : getOptionLabel(selectedInfo)}
      </div>
      <DropdownArrowIcon rotate={showMenu} color={arrowColor} arrow={arrow} size={arrowSize} />
      <AnimatePresence>
        {showMenu && (
          <Portal>
            <div
              ref={setPopperRef}
              style={{
                ...styles.popper,
                ...(menuPlacementTop ? { bottom: 40, top: 'unset' } : {}),
                zIndex: Z_INDEXS.POPOVER_CONTAINER,
              }}
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{ ...(matchMenuWidth ? { width: ref.current?.offsetWidth } : {}), ...menuStyle }}
                className="z-[2] w-max overflow-hidden rounded-2xl bg-background p-2 [filter:drop-shadow(0px_4px_12px_rgba(0,0,0,0.36))]"
              >
                {withSearch && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="relative mb-2 flex items-center justify-center rounded-lg bg-white/[0.04] text-subText [transition:background-color_0.1s_ease,color_0.1s_ease] focus-within:bg-white/[0.08] focus-within:text-text hover:bg-white/[0.08] hover:text-text"
                  >
                    <span className="absolute left-2">
                      <Icon id="search" />
                    </span>
                    <input
                      placeholder={t`Search...`}
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      className="w-full border-none bg-transparent ps-10 leading-8 text-text outline-none"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {dropdownRender ? dropdownRender(renderMenu()) : renderMenu()}
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  )
}
