import React from 'react'
import AvaxContestDesktop from 'assets/banners/Avax-Contest-Desktop.png'
import AvaxContestMobile from 'assets/banners/Avax-Contest-mobile.png'
import AvaxContestTablet from 'assets/banners/Avax-Contest-Tablet.png'
import AvaxLMDesktop from 'assets/banners/Avax-LM-desktop.png'
import AvaxLMMobile from 'assets/banners/Avax-LM-mobile.png'
import AvaxLMTablet from 'assets/banners/Avax-LM-tablet.png'
import { useWindowSize } from 'hooks/useWindowSize'
import styled from 'styled-components'

const Wrapper = styled.div<{ margin?: string; maxWidth?: string; padding?: string }>`
  margin: auto;
  width: 100%;
  margin: ${({ margin }) => margin || 'auto'};
  padding: ${({ padding }) => padding || 0};
  max-width: ${({ maxWidth }) => maxWidth || '1028px'};
  border-radius: 8px;
  overflow: hidden;

  img {
    border-radius: 8px;
  }
`

function Banner({ margin, padding, maxWidth }: { margin?: string; padding?: string; maxWidth?: string }) {
  const size = useWindowSize()
  const w = size?.width || 0

  const banners = [
    {
      start: new Date(),
      end: new Date(1647867600000), // March 21, 2022 - 20h VNT
      img: w >= 768 ? AvaxContestDesktop : w >= 500 ? AvaxContestTablet : AvaxContestMobile,
      link:
        'https://kyberswap.com/?utm_source=kyberswap&utm_medium=banner&utm_campaign=avaxphase2&utm_content=trading#/swap?networkId=43114',
    },
    {
      start: new Date(1647867600000), // March 21, 2022 - 20h VNT
      end: new Date(1651276800000), // April 30, 2022 - 0h GMT+0
      img: w >= 768 ? AvaxLMDesktop : w >= 500 ? AvaxLMTablet : AvaxLMMobile,
      link:
        'https://kyberswap.com/?utm_source=kyberswap&utm_medium=banner&utm_campaign=avaxphase2&utm_content=lm#/farms?networkId=43114',
    },
  ]

  const banner = banners.find(b => {
    const date = new Date()
    return date >= b.start && date <= b.end
  })

  if (!banner) return null

  return (
    <Wrapper margin={margin} padding={padding} maxWidth={maxWidth}>
      <a href={banner.link}>
        <img src={banner.img} alt="banner" width="100%" />
      </a>
    </Wrapper>
  )
}

export default Banner
