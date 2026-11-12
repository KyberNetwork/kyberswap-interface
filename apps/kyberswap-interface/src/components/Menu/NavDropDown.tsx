import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Collapse } from 'components/Collapse'
import { MenuItem, MenuItemContent, MenuItemLink } from 'components/Menu/MenuItems'
import { HStack, Stack } from 'components/Stack'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

type NavDropDownOption = {
  external?: boolean
  label?: ReactNode
  link?: string
}

type NavDropDownProps = {
  icon?: ReactNode
  options?: NavDropDownOption[]
  title?: ReactNode
}

const NavDropDown = ({ title, icon, options = [] }: NavDropDownProps) => {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const toggleOptions = () => {
    setIsShowOptions(prev => !prev)
  }

  return (
    <Stack className="flex-1 overflow-hidden">
      <MenuItemContent onClick={toggleOptions} fullWidth className="justify-between">
        <HStack className="min-w-0 items-center gap-2 [&_svg]:size-4">
          {icon}
          {title}
        </HStack>
        <DropdownSVG
          className={cn('-mx-1 size-6 shrink-0 transition-all duration-200 ease-in-out', isShowOptions && 'rotate-180')}
        />
      </MenuItemContent>
      <Collapse
        open={isShowOptions}
        className="duration-300"
        fade={false}
        contentClassName="flex flex-col"
        contentGap={3}
      >
        <Stack as="ul" className="m-0 list-none pl-6">
          {options.map(item => {
            const optionLink = item.link ?? ''

            return (
              <MenuItem key={optionLink}>
                {item.external ? (
                  <MenuItemLink>
                    <ExternalLink href={optionLink} onClick={toggle}>
                      {item.label}
                    </ExternalLink>
                  </MenuItemLink>
                ) : (
                  <MenuItemLink>
                    <NavLink to={optionLink} onClick={toggle}>
                      {item.label}
                    </NavLink>
                  </MenuItemLink>
                )}
              </MenuItem>
            )
          })}
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default NavDropDown
