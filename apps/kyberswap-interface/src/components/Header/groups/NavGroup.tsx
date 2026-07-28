import { useState } from 'react'
import { isMobile } from 'react-device-detect'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { cn } from 'utils/cn'

export type DropdownAlign = 'left' | 'right' | 'center'

type Props = {
  id?: string
  forceOpen?: boolean
  isActive?: boolean
  anchor: React.ReactNode
  dropdownContent: React.ReactNode
  dropdownAlign?: DropdownAlign
  className?: string
}

const NavGroup: React.FC<Props> = ({
  id,
  forceOpen,
  isActive,
  anchor,
  dropdownContent,
  dropdownAlign = 'left',
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const showDropdown = Boolean(forceOpen || isHovered)
  return (
    <div
      id={id}
      className={cn(
        'group relative inline-block w-fit select-none text-base font-medium leading-[normal]',
        isActive ? 'text-primary' : 'text-subText',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex cursor-pointer items-center gap-0.5 hover:brightness-90">
        {anchor}
        {dropdownContent && (
          <DropdownSVG className={cn('transition-transform duration-300', showDropdown && 'rotate-180')} />
        )}
      </div>
      {dropdownContent && (
        <div
          data-align={dropdownAlign}
          onClick={e => {
            e.stopPropagation()
            if (isMobile) setIsHovered(false)
          }}
          className={cn(
            'absolute top-full w-max rounded-2xl bg-tableHeader p-2',
            '[filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.36))]',
            'shadow-[0_0_1px_rgba(0,0,0,0.01),0_4px_8px_rgba(0,0,0,0.04),0_16px_24px_rgba(0,0,0,0.04),0_24px_32px_rgba(0,0,0,0.01)]',
            'data-[align=center]:left-1/2 data-[align=left]:left-0 data-[align=right]:right-0 data-[align=center]:-translate-x-1/2',
            showDropdown ? 'flex flex-col' : 'hidden',
          )}
        >
          {dropdownContent}
        </div>
      )}
    </div>
  )
}

export default NavGroup
