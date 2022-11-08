import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import { ExternalNavMenuItem, NavMenuItem } from './MenuItems'

const StyledChevronDown = styled(ChevronDown)<{ rotated?: boolean }>`
  margin-left: -2px;
  transition: all 100ms ease;
  ${({ rotated }) =>
    rotated &&
    css`
      transform: rotate(-180deg);
    `}
`

type Props = {
  title: string
  icon: ReactNode
  link: string
  options: { link: string; label: string; external?: boolean }[]
}

const NavDropDown: React.FC<Props> = ({ title, link, icon, options }) => {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <NavMenuItem to={link} onClick={handleClick}>
        {icon}
        <Trans>{title}</Trans>
        <StyledChevronDown size={16} rotated={isShowOptions} />
      </NavMenuItem>

      {isShowOptions && (
        <Flex
          sx={{
            flexDirection: 'column',
            paddingLeft: '22px',
            gap: '16px',
          }}
        >
          {options.map(item =>
            item.external ? (
              <ExternalNavMenuItem key={item.link} href={item.link} onClick={toggle}>
                <Trans>{item.label}</Trans>
              </ExternalNavMenuItem>
            ) : (
              <NavMenuItem to={item.link} key={item.link} onClick={toggle}>
                <Trans>{item.label}</Trans>
              </NavMenuItem>
            ),
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default NavDropDown
