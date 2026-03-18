import { rgba } from 'polished'
import styled from 'styled-components'

import { PoolPageWrapper } from 'pages/Earns/PoolExplorer/styles'

type NoteCardTone = 'info' | 'warning' | 'error'

export const PoolDetailWrapper = styled(PoolPageWrapper)`
  padding: 32px 24px 68px;
  margin: 0 auto;
  width: 100%;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const NoteCard = styled.div<{ $warning?: boolean; $tone?: NoteCardTone }>`
  padding: 8px 12px;
  border-radius: 12px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  background: ${({ theme, $warning, $tone }) => {
    const tone = $tone || ($warning ? 'warning' : 'info')
    return tone === 'error'
      ? rgba(theme.red, 0.12)
      : tone === 'warning'
      ? rgba(theme.warning, 0.12)
      : rgba(theme.primary, 0.12)
  }};
  border: 1px solid
    ${({ theme, $warning, $tone }) => {
      const tone = $tone || ($warning ? 'warning' : 'info')
      return tone === 'error'
        ? rgba(theme.red, 0.24)
        : tone === 'warning'
        ? rgba(theme.warning, 0.24)
        : rgba(theme.primary, 0.24)
    }};
`
