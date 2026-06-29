import { type MouseEvent, type ReactNode, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
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
  link?: string
  options?: NavDropDownOption[]
  title?: ReactNode
}

const NavDropDown = ({ title, link = '', icon, options = [] }: NavDropDownProps) => {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <Stack className="flex-1 overflow-hidden transition-all duration-200 ease-in-out">
      <NavLink to={link} onClick={handleClick} className="block">
        <HStack className="items-center justify-between gap-2">
          {icon}
          <span className="flex-1">{title}</span>
          <DropdownSVG
            className={cn('!h-6 !w-6 transition-all duration-200 ease-in-out', isShowOptions && 'rotate-180')}
          />
        </HStack>
      </NavLink>
      <Stack
        ref={ref}
        style={{ height: isShowOptions ? `${ref.current?.scrollHeight || 0}px` : '0px' }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <Stack className="gap-2 pl-6 pt-2.5">
          {options.map(item => {
            const optionLink = item.link ?? ''

            return item.external ? (
              <ExternalLink key={optionLink} href={optionLink} onClick={toggle}>
                {item.label}
              </ExternalLink>
            ) : (
              <NavLink to={optionLink} key={optionLink} onClick={toggle}>
                {item.label}
              </NavLink>
            )
          })}
        </Stack>
      </Stack>
    </Stack>
  )
}

export default NavDropDown
