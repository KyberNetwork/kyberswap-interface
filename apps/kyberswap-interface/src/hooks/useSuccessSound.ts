import successSoundFile from '@/assets/sounds/success.mp3'
import useSound from 'use-sound'

export const useSuccessSound = () => {
  const [play] = useSound(successSoundFile, {
    volume: 0.2, // Adjust volume as needed
  })

  return play
}
