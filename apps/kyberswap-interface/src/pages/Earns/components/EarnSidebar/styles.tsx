import { HTMLMotionProps, motion } from 'framer-motion'
import { ButtonHTMLAttributes, ElementType, HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export const SIDEBAR_WIDTH_EXPANDED = 220
export const SIDEBAR_WIDTH_COLLAPSED = 64

type SidebarContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  $collapsed?: boolean
  $inDrawer?: boolean
}
export const SidebarContainer = ({
  as: Tag = 'div',
  $collapsed,
  $inDrawer,
  className,
  style,
  ...rest
}: SidebarContainerProps) => {
  const width = $collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
  return (
    <Tag
      className={cn(
        'flex shrink-0 flex-col gap-4 whitespace-nowrap px-3 pb-3 pt-6',
        'transition-[width,min-width] duration-200',
        $inDrawer ? 'w-full min-w-0 overflow-visible' : 'overflow-hidden max-md:hidden',
        className,
      )}
      style={$inDrawer ? style : { width, minWidth: width, ...style }}
      {...rest}
    />
  )
}

type SidebarHeaderProps = HTMLAttributes<HTMLDivElement> & { $collapsed?: boolean; $active?: boolean }
export const SidebarHeader = ({ $collapsed, $active, className, ...rest }: SidebarHeaderProps) => (
  <div
    className={cn(
      'flex min-h-10 items-center gap-1 rounded-xl transition-[padding,background] duration-200',
      $collapsed ? 'justify-center p-0.5' : 'justify-between py-1 pl-4 pr-1',
      $active ? 'bg-white/[0.06]' : 'bg-transparent',
      'focus-within:bg-white/[0.06] hover:bg-white/[0.06]',
      className,
    )}
    {...rest}
  />
)

type SidebarHeaderLabelProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }
export const SidebarHeaderLabel = ({ $active, className, ...rest }: SidebarHeaderLabelProps) => (
  <button
    className={cn(
      'min-w-0 flex-1 cursor-pointer overflow-hidden whitespace-nowrap border-none bg-none p-0 text-left',
      'font-[inherit] text-sm font-medium uppercase tracking-[0.5px] transition-colors',
      $active ? 'text-primary' : 'text-subText',
      'hover:text-primary focus-visible:text-primary focus-visible:outline-none',
      className,
    )}
    {...rest}
  />
)

export const CollapseToggleButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0',
      'text-subText transition-colors hover:bg-white-04 hover:text-text',
      className,
    )}
    {...rest}
  />
)

export const SidebarGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1', className)} {...rest} />
)

type SidebarGroupLabelProps = HTMLAttributes<HTMLDivElement> & { $active?: boolean }
export const SidebarGroupLabel = ({ $active, className, ...rest }: SidebarGroupLabelProps) => (
  <div
    className={cn(
      'flex items-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium uppercase tracking-[0.5px]',
      $active ? 'bg-white/[0.06] text-primary' : 'bg-transparent text-subText',
      className,
    )}
    {...rest}
  />
)

type SidebarNavItemProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean; $collapsed?: boolean }
export const SidebarNavItem = ({ $active, $collapsed, className, ...rest }: SidebarNavItemProps) => (
  <button
    className={cn(
      'relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent text-left',
      'whitespace-nowrap font-[inherit] text-sm transition-[color,background,padding] duration-200',
      $collapsed ? 'px-[11px] py-2.5' : 'py-2.5 pl-6 pr-4',
      $active ? 'font-medium text-primary' : 'font-normal text-gray',
      '[&>svg]:shrink-0',
      // Neutralize hardcoded fill/stroke colors in legacy icons so they inherit the nav
      // item's color (active = primary, inactive = gray). Icons already using
      // currentColor are unaffected — these selectors only match explicit attributes.
      '[&>svg_path[fill]:not([fill=none]):not([fill=currentColor])]:fill-current',
      '[&>svg_path[stroke]:not([stroke=none]):not([stroke=currentColor])]:stroke-current',
      'hover:bg-white-04 hover:text-primary focus-visible:bg-white-04 focus-visible:text-primary focus-visible:outline-none',
      $active &&
        cn(
          "before:absolute before:left-4 before:top-1/2 before:h-[18px] before:w-0.5 before:-translate-y-1/2 before:rounded-sm before:bg-primary before:transition-opacity before:content-['']",
          $collapsed ? 'before:opacity-0' : 'before:opacity-100',
        ),
      className,
    )}
    {...rest}
  />
)

export const GroupDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mx-3 my-1 h-px bg-white/[0.06]', className)} {...rest} />
)

type BreadcrumbsContainerProps = HTMLAttributes<HTMLElement> & { as?: ElementType }
export const BreadcrumbsContainer = ({ as: Tag = 'div', className, ...rest }: BreadcrumbsContainerProps) => (
  <Tag className={cn('mb-4 hidden min-w-0 items-center gap-2 max-md:flex', className)} {...rest} />
)

export const BreadcrumbsToggleButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none p-0',
      'bg-white-04 text-subText transition-colors hover:bg-white-08 hover:text-text',
      className,
    )}
    {...rest}
  />
)

export const BreadcrumbsTrail = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 items-center gap-1.5 overflow-hidden', className)} {...rest} />
)

type BreadcrumbsItemProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  type?: 'button'
  $current?: boolean
  $clickable?: boolean
}
export const BreadcrumbsItem = ({
  as: Tag = 'span',
  $current,
  $clickable,
  className,
  ...rest
}: BreadcrumbsItemProps) => (
  <Tag
    className={cn(
      'truncate border-none bg-none p-0 font-[inherit] text-sm transition-colors',
      $current ? 'font-medium text-text' : 'font-normal text-subText',
      $clickable ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none cursor-default',
      $clickable && 'hover:text-primary focus-visible:text-primary focus-visible:outline-none',
      className,
    )}
    {...rest}
  />
)

export const BreadcrumbsSeparator = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('shrink-0 text-sm text-subText', className)} {...rest} />
)

export const MobileDrawerOverlay = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('fixed inset-0 z-[9998] bg-black/60', className)} {...rest} />
)

export const MobileDrawerPanel = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div
    className={cn(
      'fixed inset-y-0 left-0 z-[9999] flex w-[260px] max-w-[85vw] flex-col overflow-y-auto bg-background',
      'shadow-[4px_0_16px_rgb(var(--ks-black-rgb)/0.4)]',
      className,
    )}
    {...rest}
  />
)
