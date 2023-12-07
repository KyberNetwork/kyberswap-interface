import { readableColor } from 'polished'
import { PropsWithChildren } from 'react'
import { Text } from 'rebass'
import styled, { DefaultTheme } from 'styled-components'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import { Color } from 'theme/styled'
import { formatDisplayNumber } from 'utils/numbers'

export enum BadgeVariant {
  DEFAULT = 'DEFAULT',
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
  PRIMARY = 'PRIMARY',
  BLUE = 'BLUE',
  WHITE = 'WHITE',
  WARNING = 'WARNING',

  WARNING_OUTLINE = 'WARNING_OUTLINE',
}

interface BadgeProps {
  variant?: BadgeVariant
}

function pickBackgroundColor(variant: BadgeVariant | undefined, theme: DefaultTheme): Color {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return theme.red + '33'
    case BadgeVariant.POSITIVE:
      return theme.green1
    case BadgeVariant.PRIMARY:
      return theme.primary + '33'
    case BadgeVariant.BLUE:
      return theme.blue + '33'
    case BadgeVariant.WHITE:
      return theme.white + '33'
    case BadgeVariant.WARNING:
      return theme.warning + '33'
    case BadgeVariant.WARNING_OUTLINE:
      return 'transparent'
    default:
      return theme.background
  }
}

function pickBorder(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.WARNING_OUTLINE:
      return `1px solid ${theme.warning}`
    default:
      return 'unset'
  }
}

function pickFontColor(variant: BadgeVariant | undefined, theme: DefaultTheme): string {
  switch (variant) {
    case BadgeVariant.NEGATIVE:
      return theme.red
    case BadgeVariant.POSITIVE:
      return readableColor(theme.green1)
    case BadgeVariant.WARNING:
      return theme.warning
    case BadgeVariant.PRIMARY:
      return theme.primary
    case BadgeVariant.BLUE:
      return theme.blue
    case BadgeVariant.WHITE:
      return theme.white
    case BadgeVariant.WARNING_OUTLINE:
      return theme.warning
    default:
      return readableColor(theme.bg2)
  }
}

const Badge = styled.div<PropsWithChildren<BadgeProps>>`
  align-items: center;
  background-color: ${({ theme, variant }) => pickBackgroundColor(variant, theme)};
  border: ${({ theme, variant }) => pickBorder(variant, theme)};
  border-radius: 999px;
  color: ${({ theme, variant }) => pickFontColor(variant, theme)};
  display: inline-flex;
  padding: 4px 8px;
  justify-content: center;
  font-weight: 500;
`

export default Badge

// todo update my earning use this
export const PercentBadge = ({ percent }: { percent: number }) => {
  return (
    <Badge
      variant={percent ? BadgeVariant.PRIMARY : BadgeVariant.NEGATIVE}
      style={{ padding: '2px 10px 2px 2px', height: 'fit-content' }}
    >
      <DropdownArrowIcon rotate={percent > 0} />{' '}
      <Text fontSize={'12px'} as="span" fontWeight={'500'}>
        {formatDisplayNumber(percent, { style: 'percent', fractionDigits: 2 })}
      </Text>
    </Badge>
  )
}
