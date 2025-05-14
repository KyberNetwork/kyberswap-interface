import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
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

export const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

export const BannerWrapper = styled.div`
  width: 100%;
  gap: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    gap: 12px;
  `}
`

export const TrendingWrapper = styled.div`
  width: 45%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `}
`

export const FarmingWrapper = styled.div`
  width: calc(55% - 20px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `}
`
