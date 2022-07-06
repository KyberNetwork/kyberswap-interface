import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import TrendingSoonHeroLaptop from 'assets/images/trending_hero.png'
import useTheme from 'hooks/useTheme'

const Hero = styled.div`
  width: 100%;
  padding: 16px 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};

  background-image: url(${TrendingSoonHeroLaptop});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    background-image: none;
  `}
`

const MainContent = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const SubContent = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  font-size: 10px;
  margin-top: 8px;
`

const TrendingSoonHero = () => {
  return (
    <Hero>
      <MainContent>
        <Trans>
          Our TrueSight technology analyzes on-chain data, trading volumes and price trendlines to discover tokens that
          could be trending in the near future
        </Trans>
      </MainContent>
      <SubContent>
        <Trans>Disclaimer: The information here should not be treated as any form of financial advice</Trans>
      </SubContent>
    </Hero>
  )
}

export default TrendingSoonHero
