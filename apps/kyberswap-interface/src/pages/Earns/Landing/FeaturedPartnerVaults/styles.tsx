import { rgba } from 'polished'
import styled from 'styled-components'

export { PartnerVaultsList } from 'pages/Earns/Landing/styles'

const VAULT_CARD_BG = 'rgba(54, 39, 86, 0.2)'
const VAULT_CARD_BG_HOVER = 'rgba(91, 58, 164, 0.32)'

export const VaultCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: ${VAULT_CARD_BG};
  transition: background 0.2s ease;

  &:hover {
    background: ${VAULT_CARD_BG_HOVER};
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
  line-height: 16px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: opacity 0.15s ease, background 0.15s ease;

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 0.85)};
    background: ${({ $disabled, theme }) => ($disabled ? 'transparent' : `${theme.primary}10`)};
  }
`
