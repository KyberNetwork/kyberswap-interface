import { ReactNode, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export default function NavDropDown({
  title,
  link,
  icon,
  options,
}: {
  title: ReactNode
  icon: ReactNode
  link: string
  options: { link: string; label: ReactNode; external?: boolean }[]
}) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <div className="flex-1 overflow-hidden transition-all duration-200 ease-in-out">
      <NavLink to={link} onClick={handleClick} className="flex justify-between">
        {icon}
        <span className="flex-1">{title}</span>
        <DropdownSVG
          className={cn('!h-6 !w-6 transition-all duration-200 ease-in-out', isShowOptions && 'rotate-180')}
        />
      </NavLink>
      <div
        ref={ref}
        style={{ height: isShowOptions ? `${ref.current?.scrollHeight || 0}px` : '0px' }}
        className={cn(
          'pl-6 transition-all duration-300 ease-in-out',
          '[&>*:first-child]:pt-6 [&>*:last-child]:pb-0 [&>*]:py-3',
        )}
      >
        {options.map(item =>
          item.external ? (
            <ExternalLink key={item.link} href={item.link} onClick={toggle}>
              {item.label}
            </ExternalLink>
          ) : (
            <NavLink to={item.link} key={item.link} onClick={toggle}>
              {item.label}
            </NavLink>
          ),
        )}
      </div>
    </div>
  )
}
