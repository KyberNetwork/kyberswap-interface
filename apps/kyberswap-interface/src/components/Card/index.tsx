import { rgba } from 'polished'
import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const Card = styled(Box)<{ padding?: string; border?: string; borderRadius?: string }>`
  width: 100%;
  border-radius: 20px;
  padding: 1.25rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const BlackCard = styled(Card)`
  background-color: ${({ theme }) => theme.buttonBlack};
`

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.border};
`

export const WarningCard = styled(Card)`
  background-color: ${({ theme }) => rgba(theme.warning, 0.25)};
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`
