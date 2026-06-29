import { type CSSProperties, type KeyboardEvent, type PropsWithChildren, cloneElement, isValidElement } from 'react'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type MenuItemProps = PropsWithChildren<{
  id?: string
  style?: CSSProperties
  className?: string
}>

export const MenuItem = ({ children, id, style, className }: MenuItemProps) => (
  <HStack as="li" id={id} style={style} className={cn('flex-1 items-center py-2.5', className)}>
    {children}
  </HStack>
)

type MenuItemContentProps = PropsWithChildren<{
  className?: string
  fullWidth?: boolean
  id?: string
  onClick?: () => void
  style?: CSSProperties
}>

export const MenuItemContent = ({ children, className, fullWidth, id, onClick, style }: MenuItemContentProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    onClick()
  }

  return (
    <span
      id={id}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      style={style}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        fullWidth ? 'flex w-full' : 'inline-flex w-fit',
        'items-center gap-2 whitespace-nowrap text-base font-medium text-subText !no-underline transition-colors hover:text-text focus:text-text',
        !fullWidth && '[&_svg]:size-4',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </span>
  )
}

type MenuItemLinkProps = PropsWithChildren<{
  className?: string
  fullWidth?: boolean
}>

export const MenuItemLink = ({ children, className, fullWidth }: MenuItemLinkProps) => {
  if (!isValidElement<{ className?: string }>(children)) return null

  return cloneElement(children, {
    className: cn(
      fullWidth ? 'flex w-full' : 'inline-flex w-fit',
      'items-center gap-2 whitespace-nowrap text-base font-medium text-subText !no-underline transition-colors hover:text-text focus:text-text',
      !fullWidth && '[&_svg]:size-4',
      children.props.className,
      className,
    ),
  })
}

type MenuSectionProps = PropsWithChildren<{
  className?: string
}>

export const MenuSection = ({ children, className }: MenuSectionProps) => (
  <Stack as="ul" className={cn('m-0 list-none px-5 py-2', className)}>
    {children}
  </Stack>
)

type NavLinkBetweenProps = PropsWithChildren<{
  onClick?: () => void
  id?: string
}>

export const NavLinkBetween = ({ children, onClick, id }: NavLinkBetweenProps) => (
  <MenuItem>
    <MenuItemContent id={id} onClick={onClick} fullWidth className="justify-between">
      {children}
    </MenuItemContent>
  </MenuItem>
)

export const Divider = () => <div className="border-t border-border" />

type TitleProps = PropsWithChildren<{
  style?: CSSProperties
  className?: string
}>

export const Title = ({ children, style, className }: TitleProps) => (
  <MenuItem style={style} className={className}>
    <MenuItemContent className="text-base !text-text [&_svg]:size-4">{children}</MenuItemContent>
  </MenuItem>
)
