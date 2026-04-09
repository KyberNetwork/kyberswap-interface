import { rgba } from 'polished'
import styled from 'styled-components'

export const FeaturedVaultsContainer = styled.div`
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 12px;
  padding-bottom: 24px;
`

export const FeaturedVaultsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px 0;
  color: ${({ theme }) => theme.text};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px 16px 0;
  `}
`

export const VaultCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 16px 24px 0;

  & > :last-child:nth-child(odd) {
    grid-column: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px 16px 0;
  `}
`

export const VaultCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${({ theme }) => rgba(theme.white, 0.06)};
    transform: translateY(-1px);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px;
  `}
`

export const VaultProtocolTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  white-space: nowrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

export const VaultDepositButton = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  font-weight: 500;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};
  transition: opacity 0.15s ease, background 0.15s ease;

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 0.3 : 0.8)};
    background: ${({ $disabled, theme }) => ($disabled ? 'transparent' : `${theme.primary}10`)};
  }
`
