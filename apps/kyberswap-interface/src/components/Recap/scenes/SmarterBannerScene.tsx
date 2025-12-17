import { memo } from 'react'

import {
  SmarterBannerBg,
  SmarterBannerText,
  SmarterBannerWrapper,
  SmarterBold,
} from 'components/Recap/RecapJourney.styles'

interface SmarterBannerSceneProps {
  isSmarterFinaleScene: boolean
}

function SmarterBannerScene({ isSmarterFinaleScene }: SmarterBannerSceneProps) {
  return (
    <SmarterBannerWrapper>
      <SmarterBannerBg
        initial={{
          width: 'auto',
          height: 'auto',
          bottom: 40,
          left: '50%',
          x: '-50%',
          borderRadius: 8,
        }}
        animate={
          isSmarterFinaleScene
            ? {
                width: '100%',
                height: '100%',
                bottom: 0,
                left: '50%',
                x: '-50%',
                borderRadius: 0,
              }
            : {
                width: 'auto',
                height: 'auto',
                bottom: 40,
                left: '50%',
                x: '-50%',
                borderRadius: 8,
              }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SmarterBannerText
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isSmarterFinaleScene ? 1.3 : 1 }}
          transition={{ duration: 0.8, ease: isSmarterFinaleScene ? 'easeOut' : undefined }}
        >
          That&apos;s your liquidity working <SmarterBold>smarter</SmarterBold>
        </SmarterBannerText>
      </SmarterBannerBg>
    </SmarterBannerWrapper>
  )
}

export default memo(SmarterBannerScene)
