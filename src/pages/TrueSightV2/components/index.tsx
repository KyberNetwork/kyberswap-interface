import styled from 'styled-components'

export const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 12px;
  margin-top: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`
export const SectionDescription = styled.div`
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.subText};
`
export const SectionWrapper = styled.div`
  border-radius: 20px;
  ${({ theme }) => `background-color: ${theme.background};`}
  content-visibility:auto;
  contain-intrinsic-height: auto;
`
