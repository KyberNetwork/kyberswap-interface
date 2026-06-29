import type { CSSProperties, ReactNode } from 'react'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type MenuItemProps = {
  children?: ReactNode
  onClick?: () => void
  id?: string
  style?: CSSProperties
  className?: string
}

type MenuSectionProps = {
  children?: ReactNode
  className?: string
}

type NavLinkBetweenProps = {
  children?: ReactNode
  onClick?: () => void
  id?: string
}

type NewLabelProps = {
  children?: ReactNode
  isNew?: boolean
}

type TitleProps = {
  children?: ReactNode
  style?: CSSProperties
  className?: string
}

export const MenuItem = ({ children, onClick, id, style, className }: MenuItemProps) => (
  <HStack
    as="li"
    id={id}
    onClick={onClick}
    style={style}
    className={cn(
      'flex-1 items-center gap-2 whitespace-nowrap py-2.5 text-[15px] font-medium text-subText no-underline',
      '[&_svg]:size-4',
      '[&_a]:flex [&_a]:items-center [&_a]:gap-2 [&_a]:text-subText hover:[&_a]:text-text hover:[&_a]:no-underline',
      className,
    )}
  >
    {children}
  </HStack>
)

export const MenuSection = ({ children, className }: MenuSectionProps) => (
  <Stack as="ul" className={cn('list-none px-5 py-2', className)}>
    {children}
  </Stack>
)

export const NavLinkBetween = ({ children, onClick, id }: NavLinkBetweenProps) => (
  <MenuItem
    id={id}
    onClick={onClick}
    className={cn(
      '!static max-h-10 cursor-pointer justify-between transition-colors hover:text-text',
      '[&_svg]:!h-auto [&_svg]:!w-auto',
    )}
  >
    {children}
  </MenuItem>
)

export const NewLabel = ({ isNew, children }: NewLabelProps) => (
  <span className={cn('text-[10px]', isNew ? 'text-red' : 'text-subText')}>{children}</span>
)

export const Divider = () => <div className="border-t border-border" />

export const Title = ({ children, style, className }: TitleProps) => (
  <MenuItem style={style} className={cn('text-base !text-text', '[&_svg]:size-4', className)}>
    {children}
  </MenuItem>
)
