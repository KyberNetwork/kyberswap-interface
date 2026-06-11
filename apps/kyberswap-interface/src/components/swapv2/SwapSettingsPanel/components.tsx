import { Placement } from '@popperjs/core'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import { HStack, Stack, StackProps } from 'components/Stack'
import { TextHelper } from 'components/Text'
import Toggle, { ToggleProps } from 'components/Toggle'
import { cn } from 'utils/cn'

type SettingsSectionProps = {
  title: ReactNode
  children: ReactNode
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <Stack className="w-full gap-3">
    <span className="text-base font-medium text-text">{title}</span>
    <Stack className="w-full gap-3 text-xs font-normal text-subText">{children}</Stack>
  </Stack>
)

export const SettingsDivider = () => (
  <div className="-mx-4 w-[calc(100%+2rem)] border-t border-solid border-border/60" />
)

export const SettingsRow = ({ className, ...props }: StackProps) => (
  <HStack className={cn('min-h-7 min-w-full items-center justify-between gap-3', className)} {...props} />
)

type SettingsLabelProps = {
  children: ReactNode
  tooltip: ReactNode
  placement?: Placement
}

export const SettingsLabel = ({ children, tooltip, placement = 'right' }: SettingsLabelProps) => (
  <HStack className="items-center">
    <TextHelper fontSize={12} fontWeight={400} className="text-subText" tooltip={tooltip} placement={placement}>
      {children}
    </TextHelper>
  </HStack>
)

export const SettingsAction = ({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'flex cursor-pointer items-center gap-0 border-0 bg-transparent p-0 text-left text-xs font-medium text-text transition-[filter] hover:brightness-75 focus-visible:outline-none',
      className,
    )}
    type="button"
    {...props}
  >
    {children}
  </button>
)

export const SettingsToggle = ({ className, ...props }: ToggleProps) => (
  <Toggle className={cn('bg-buttonBlack hover:brightness-75', className)} {...props} />
)
