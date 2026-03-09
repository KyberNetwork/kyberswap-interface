import styled from 'styled-components'

import { PoolPageWrapper } from 'pages/Earns/PoolExplorer/styles'

export const PoolDetailWrapper = styled(PoolPageWrapper)`
  padding: 32px 24px 68px;
  margin: 0 auto;
  width: 100%;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const NoteCard = styled.div<{ $warning?: boolean }>`
  padding: 12px 14px;
  border-radius: 14px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  line-height: 1.6;
  background: ${({ theme, $warning }) => ($warning ? `${theme.warning}1f` : `${theme.primary}14`)};
  border: 1px solid ${({ theme, $warning }) => ($warning ? `${theme.warning}40` : `${theme.primary}26`)};
`
