import { AutoColumn } from 'components/Column'
import styled from 'styled-components/macro'

export const PageWrapper = styled.div`
  margin: 24px 12px;
`

export const Container = styled.div`
  max-width: 480px;
  width: 100%;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.background};

  padding: 6px 26px 40px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 16px 24px;
  `};
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
  margin: 1rem 0;
`
