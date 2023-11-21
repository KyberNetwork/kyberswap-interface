import { rgba } from 'polished'
import styled from 'styled-components'

export const PageTitle = styled.h1(({ theme }) => ({
  fontSize: 24,
  fontWeight: '500',
  color: theme.text,
}))

export const ChainLogo = styled.img<{ size?: number }>(({ size }) => ({
  width: size || '20px',
  height: size || '20px',
  position: 'absolute',
  right: 0,
  bottom: 0,
  zIndex: 1,
}))

export const Tag = styled.div<{ color: string }>(({ color }) => ({
  borderRadius: '999px',
  padding: '2px 4px',
  fontSize: '12px',
  fontWeight: '500',
  color,
  background: rgba(color, 0.2),
}))

export const FilterGroup = styled.div(({ theme }) => ({
  display: 'flex',
  borderRadius: '999px',
  padding: '2px',
  border: `1px solid ${theme.border}`,
  width: 'fit-content',
}))

export const FilterItem = styled.button<{ active: boolean }>(({ active, theme }) => ({
  all: 'unset',
  borderRadius: '999px',
  padding: '8px 10px',
  fontSize: '12px',
  fontWeight: '500',
  color: active ? theme.text : theme.subText,
  background: active ? theme.tabActive : 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.3s ease',

  '> svg': {
    width: 16,
    height: 16,
    path: {
      fill: 'currentcolor',
      fillOpacity: 1,
    },
  },
}))

export const PositionTable = styled.div(({ theme }) => ({
  borderRadius: '1rem',
  border: `1px solid ${theme.border}`,
  overflow: 'hidden',
}))

export const PositionTableHeader = styled.div(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  background: theme.tableHeader,
  fontSize: '12px',
  fontWeight: '500',
  padding: '1rem 12px',
  color: theme.subText,
  alignItems: 'center',
  gap: '12px',
}))

export const PositionTableRow = styled(PositionTableHeader)(({ theme }) => ({
  background: 'transparent',
  borderBottom: `1px solid ${theme.border}`,
  color: theme.text,

  ':last-child': {
    borderBottom: 'none',
  },
}))
