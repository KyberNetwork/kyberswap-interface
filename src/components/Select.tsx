import { CSSProperties, ReactNode, useRef, useState } from 'react'
import styled from 'styled-components'

import { useOnClickOutside } from 'hooks/useOnClickOutside'

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
  gap: 10px;
`

const SelectMenu = styled.div`
  position: absolute;
  top: 40px;
  right: 12px;
  border-radius: 16px;
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  z-index: 10;
  background: ${({ theme }) => theme.background};
`
const DropdownIcon = styled.div<{ rotate?: boolean }>`
  transform: rotate(${({ rotate }) => (rotate ? '-180deg' : '0')});
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${({ theme }) => theme.text};

  transition: transform 300ms;
  transform: rotate(${({ rotate }) => (rotate ? '-180deg' : '0')});
`

const SelectOption = styled.div`
  padding: 12px;
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`
type Option = { value: string | number; label: string }
function Select({
  options,
  activeRender,
  style = {},
}: {
  options: Option[]
  activeRender?: (selectedItem: Option | undefined) => ReactNode
  style: CSSProperties
}) {
  const [selected, setSelected] = useState(options[0]?.value)

  const [showMenu, setShowMenu] = useState(false)
  const ref = useRef(null)
  useOnClickOutside(ref, () => setShowMenu(false))
  const selectedInfo = options.find(item => item.value === selected)
  return (
    <SelectWrapper role="button" onClick={() => setShowMenu(prev => !prev)} style={style}>
      <div style={{ flex: 1 }}>{activeRender ? activeRender(selectedInfo) : selectedInfo?.label}</div>
      <DropdownIcon rotate={showMenu} />
      {showMenu && (
        <SelectMenu ref={ref}>
          {options.map(item => (
            <SelectOption
              key={item.value}
              role="button"
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                setSelected(item.value)
                setShowMenu(prev => !prev)
              }}
            >
              {item.label || item.value}
            </SelectOption>
          ))}
        </SelectMenu>
      )}
    </SelectWrapper>
  )
}

export default Select
