import { useRef } from 'react'
import { ChevronDown as Arrow } from 'react-feather'
import styled from 'styled-components'

import Row, { RowBetween } from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { TYPE } from 'theme'

import { AutoColumn } from '../Column'

const StyledIcon = styled.div`
  color: ${({ theme }) => theme.subText};
`

const Wrapper = styled.div<{ open: boolean }>`
  z-index: 20;
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ open, color }) => (open ? color : 'rgba(0, 0, 0, 0.15);')};
  width: 110px;
  padding: 4px 10px;
  padding-right: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
  }
`

const Dropdown = styled.div`
  position: absolute;
  top: 34px;
  padding-top: 40px;
  width: calc(100% - 40px);
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 10px 10px;
  border-radius: 8px;
  width: calc(100% - 20px);
  font-weight: 500;
  font-size: 1rem;
  color: black;
  :hover {
    cursor: pointer;
  }
`

const ArrowStyled = styled(Arrow)`
  height: 20px;
  width: 20px;
  margin-left: 6px;
`

type DropdownSelectPropsType = {
  options?: any
  active?: any
  setActive?: any
  color?: any
  optionTitles?: any
  name?: ApplicationModal
}

const DropdownSelect = ({
  options,
  active,
  setActive,
  color,
  optionTitles,
  name = ApplicationModal.TIME_DROPDOWN,
}: DropdownSelectPropsType): JSX.Element => {
  const node = useRef(null)
  const open = useModalOpen(name)
  const toggle = useToggleModal(name)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <Wrapper open={open} color={color}>
      <RowBetween onClick={toggle} justify="center">
        <TYPE.main>{optionTitles && optionTitles[active] ? optionTitles[active] : active}</TYPE.main>
        <StyledIcon>
          <ArrowStyled />
        </StyledIcon>
      </RowBetween>
      {open && (
        <Dropdown ref={node}>
          <AutoColumn gap="20px">
            {Object.keys(options).map((key, index) => {
              const option = options[key]
              return (
                option !== active && (
                  <Row
                    onClick={() => {
                      toggle()
                      setActive(option)
                    }}
                    key={index}
                  >
                    <TYPE.body fontSize={14}>
                      {optionTitles && optionTitles[key] ? optionTitles[key] : option}
                    </TYPE.body>
                  </Row>
                )
              )
            })}
          </AutoColumn>
        </Dropdown>
      )}
    </Wrapper>
  )
}

export default DropdownSelect
