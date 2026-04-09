import { rgba } from 'polished'
import styled, { type DefaultTheme } from 'styled-components'

import { PoolPageWrapper } from 'pages/Earns/PoolExplorer/styles'

type NoteCardTone = 'info' | 'warning' | 'error'

const getNoteCardToneColor = (theme: DefaultTheme, tone: NoteCardTone) =>
  tone === 'error' ? theme.red : tone === 'warning' ? theme.warning : theme.primary

export const PoolDetailWrapper = styled(PoolPageWrapper)`
  width: 100%;
  gap: 24px;
  margin: 0 auto;
  padding: 32px 24px 68px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const NoteCard = styled.div<{ $warning?: boolean; $tone?: NoteCardTone }>`
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme, $warning, $tone }) => {
    const tone = $tone || ($warning ? 'warning' : 'info')
    return rgba(getNoteCardToneColor(theme, tone), 0.12)
  }};
  border: 1px solid
    ${({ theme, $warning, $tone }) => {
      const tone = $tone || ($warning ? 'warning' : 'info')
      return rgba(getNoteCardToneColor(theme, tone), 0.24)
    }};
`
