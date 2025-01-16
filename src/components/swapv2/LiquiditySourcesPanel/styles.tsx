import styled from 'styled-components'

export const Source = styled.div`
  width: 100%;
  height: 32px;

  display: flex;
  align-items: center;
  column-gap: 16px;
  padding: 12px;
`

export const ImageWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;

  img {
    width: 100%;
    height: auto;
  }
`

export const SourceName = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
`
