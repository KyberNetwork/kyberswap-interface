import styled from 'styled-components'

export const ContentWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

export const CustomBox = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  flex-direction: column;
  gap: 0.5rem;
  display: flex;
`
