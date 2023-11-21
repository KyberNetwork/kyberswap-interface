import styled from 'styled-components'

export const Wrapper = styled.div`
  max-width: 1228px;
  margin: auto;
  padding: 100px 36px 36px 36px;
  background: transparent;
  gap: 80px;
  display: flex;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 32px 16px;
    gap: 60px;
  `};
`

export const AboutPage = styled.div`
  width: 100%;
  background: linear-gradient(180deg, #0a1c23 0%, #0f0f0f 100%);
  z-index: 1;
  background-position: top, bottom;
`
