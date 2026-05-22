import styled from 'styled-components'

import { highlight } from 'components/swapv2/styleds'
import { BodyWrapper } from 'pages/AppBody'

export const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

export const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

export const BannerWrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 20px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    display: none;
  `}
`
