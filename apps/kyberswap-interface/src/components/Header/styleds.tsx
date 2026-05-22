import { CSSProperties, forwardRef } from 'react'
import { NavLink as BaseNavLink, NavLinkProps } from 'react-router-dom'

import { ExternalLink } from 'theme/components'
import { cn } from 'utils/cn'

interface Props extends NavLinkProps {
  activeStyle?: CSSProperties
  $disabled?: boolean
  customActive?: boolean
  isCustomActive?: boolean
}

// Base link styles shared by StyledNavLink and StyledNavExternalLink.
const LINK_BASE_CLASS =
  'inline-flex w-fit flex-row flex-nowrap items-start rounded-[3rem] px-3 py-2 text-base font-medium text-subText no-underline outline-none cursor-pointer max-sm:px-1.5'

const ACTIVE_CLASS = 'rounded-xl font-semibold !text-primary'

// react-router v6 removed activeClassName/activeStyle from NavLink; we recreate it via the className function form.
export const StyledNavLink = forwardRef<HTMLAnchorElement, Props>(
  ({ activeStyle, customActive, isCustomActive, $disabled, className, style, ...props }, ref) => (
    <BaseNavLink
      ref={ref}
      {...props}
      className={({ isActive }) =>
        cn(
          LINK_BASE_CLASS,
          'hover:brightness-90',
          (customActive ? isCustomActive : isActive) && ACTIVE_CLASS,
          $disabled && 'pointer-events-none !text-border',
          className as string | undefined,
        )
      }
      style={({ isActive }) => ({
        ...style,
        ...((customActive ? isCustomActive : isActive) ? activeStyle : null),
      })}
    />
  ),
)
StyledNavLink.displayName = 'StyledNavLink'

type ExternalLinkProps = React.ComponentProps<typeof ExternalLink> & {
  customActive?: boolean
  isCustomActive?: boolean
}

export const StyledNavExternalLink = ({ className, customActive, isCustomActive, ...props }: ExternalLinkProps) => (
  <ExternalLink
    {...props}
    className={cn(
      LINK_BASE_CLASS,
      'hover:!no-underline hover:brightness-90 focus:!text-subText focus:!no-underline',
      'max-xxs:!hidden',
      (customActive ? isCustomActive : false) && 'rounded-xl font-semibold',
      className,
    )}
  />
)

export const DropdownTextAnchor = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('inline-block w-fit cursor-pointer px-1.5 py-2 pr-0 text-base font-medium', className)}
    {...props}
  />
)
