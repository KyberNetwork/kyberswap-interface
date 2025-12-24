import { memo } from 'react'

import {
  ButText,
  ButYouWrapper,
  NavigatedText,
  NavigatedWrapper,
  NicknameText,
  StormText,
  TextLine,
  VideoTextWrapper,
  YouText,
} from 'components/Recap/RecapJourney.styles'
import { Scene } from 'components/Recap/types'

interface VideoSceneProps {
  scene: Scene
  nickname: string
}

function VideoScene({ scene, nickname }: VideoSceneProps) {
  const showYouLine = scene === 'video-you' || scene === 'video-nickname' || scene === 'video-navigated'
  const showNickname = scene === 'video-nickname' || scene === 'video-navigated'
  const showNavigated = scene === 'video-navigated'

  return (
    <VideoTextWrapper>
      <TextLine
        key="chaotic"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        The market was chaotic
      </TextLine>
      <ButYouWrapper
        key="you-line"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: showYouLine ? 1 : 0,
          y: showYouLine ? 0 : 20,
        }}
        transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
        style={{ visibility: showYouLine ? 'visible' : 'hidden' }}
      >
        <ButText>But</ButText>
        <YouText>YOU</YouText>
      </ButYouWrapper>
      <NicknameText
        key="nickname"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: showNickname ? 1 : 0,
          scale: showNickname ? 1 : 0.8,
        }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ visibility: showNickname ? 'visible' : 'hidden' }}
      >
        {nickname || 'Anonymous'}
      </NicknameText>
      <NavigatedWrapper
        key="navigated"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: showNavigated ? 1 : 0,
          y: showNavigated ? 0 : 20,
        }}
        transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
        style={{ visibility: showNavigated ? 'visible' : 'hidden' }}
      >
        <NavigatedText>NAVIGATED</NavigatedText>
        <StormText> the storm</StormText>
      </NavigatedWrapper>
    </VideoTextWrapper>
  )
}

export default memo(VideoScene)
