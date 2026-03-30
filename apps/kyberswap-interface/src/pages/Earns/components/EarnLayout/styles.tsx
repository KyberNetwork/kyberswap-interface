import styled from 'styled-components'

import bg from 'assets/images/earn-bg.png'

export const EarnLayoutContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: calc(100vh - 148px);
  background-image: url(${bg});
  background-size: 100% auto;
  background-repeat: repeat-y;
`

export const EarnContentArea = styled.div`
  flex: 1;
  min-width: 0;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 36px 60px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 28px 24px 48px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px 16px 40px;
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    padding: 16px 12px 36px;
  `}
`
