import React from 'react'
import styled from 'styled-components'
import { Text } from 'rebass'

import TrendingSoonHeroPng from 'assets/images/trending_soon_hero.png'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'

const Hero = styled.div`
  width: 100%;
  background-image: url(${TrendingSoonHeroPng});
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  > * {
    width: clamp(65ch, 40vw, 40vw);
  }
`

const TrendingSoonHero = () => {
  const theme = useTheme()

  return (
    <Hero>
      <Text color={theme.text} fontSize="16px" fontWeight={400} lineHeight="24px">
        <Trans>
          Our TrueSight technology analyzes on-chain data, trading volumes and price trendlines to detect tokens that
          could be &apos;trending soon&apos;
        </Trans>
      </Text>
      <Text color={theme.subText} fontSize="10px" fontWeight={400} lineHeight="11.73px">
        <Trans>Disclaimer: The information here should not be treated as any form of financial advise</Trans>
      </Text>
    </Hero>
  )
}

export default TrendingSoonHero
