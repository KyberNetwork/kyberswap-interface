import successSoundFile from '@/assets/sounds/success.mp3'
import { useCallback } from 'react'
import useSound from 'use-sound'

import { useSuccessSoundEnabled } from 'state/user/hooks'

export const useSuccessSound = () => {
  const isSuccessSoundEnabled = useSuccessSoundEnabled()

  const [play] = useSound(successSoundFile, {
    volume: 0.2, // Adjust volume as needed
  })

  return useCallback(() => {
    if (isSuccessSoundEnabled) {
      play()
    }
  }, [isSuccessSoundEnabled, play])
}
