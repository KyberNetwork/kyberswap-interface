import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React from 'react'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'

type WrapperProps = {
  $variant: 'normal' | 'warning' | 'fatal'
}
const BadgeWrapper = styled(AutoColumn).attrs<WrapperProps>(props => ({
  'data-variant': props.$variant,
}))<WrapperProps>`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
  color: ${({ theme }) => theme.primary};
  padding: 4px 8px;
  border-radius: 36px;

  line-height: 1;
  font-size: 12px;
  font-weight: 500;

  &[data-variant='warning'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.warning)};
    color: ${({ theme }) => theme.warning};
  }

  &[data-variant='fatal'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.red)};
    color: ${({ theme }) => theme.red};
  }
`

type Props = {
  level: number | undefined
}
const UpdatedBadge: React.FC<Props> = ({ level }) => {
  if (level === undefined) {
    return null
  }

  const variant = level === 0 ? 'normal' : level === 1 ? 'warning' : 'fatal'

  return (
    <BadgeWrapper justify="flex-start" gap={'0px'} $variant={variant}>
      <Trans>Updated</Trans>
    </BadgeWrapper>
  )
}

export default UpdatedBadge
